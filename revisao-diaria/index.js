import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { z } from "zod";
import { createSdkMcpServer, tool, query } from "@anthropic-ai/claude-agent-sdk";
import { Client as NotionClient } from "@notionhq/client";

const notion = new NotionClient({ auth: process.env.NOTION_TOKEN });

const __dirname = dirname(fileURLToPath(import.meta.url));
const skill = await readFile(join(__dirname, "skill.md"), "utf8");

// --- Helper: envelopa resposta como MCP CallToolResult ---
const ok = (data) => ({
  content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
});
const fail = (msg) => ({
  content: [{ type: "text", text: `ERRO: ${msg}` }],
  isError: true,
});

// --- Servidor MCP in-process com as ferramentas do Notion ---
const notionServer = createSdkMcpServer({
  name: "notion",
  version: "0.1.0",
  tools: [
    tool(
      "search",
      "Busca páginas e data sources (databases) no Notion por título. Retorna lista com id, object (page/data_source), title e url.",
      {
        query: z.string().describe("Termo de busca pelo título"),
        filter_object: z
          .enum(["page", "data_source"])
          .optional()
          .describe("Opcional: filtrar só pages ou só data_sources"),
      },
      async (args) => {
        try {
          const params = { query: args.query };
          if (args.filter_object) {
            params.filter = { property: "object", value: args.filter_object };
          }
          const res = await notion.search(params);
          const results = res.results.map((r) => ({
            id: r.id,
            object: r.object,
            url: r.url,
            title:
              r.object === "data_source"
                ? r.name ?? r.title?.[0]?.plain_text ?? "(sem título)"
                : r.properties?.Name?.title?.[0]?.plain_text ??
                  r.properties?.Atividade?.title?.[0]?.plain_text ??
                  "(sem título)",
          }));
          return ok(results);
        } catch (e) {
          return fail(e.message);
        }
      },
    ),
    tool(
      "query_data_source",
      "Consulta um data source (database) do Notion e retorna suas páginas. Use o data_source_id fornecido no system prompt.",
      {
        data_source_id: z.string().describe("ID do data source"),
        filter: z
          .any()
          .optional()
          .describe(
            "Filtro Notion API como OBJETO JSON (não string). Ex: { property: 'Status', status: { equals: 'Inbox' } }",
          ),
        sorts: z
          .any()
          .optional()
          .describe("Array de ordenação Notion API como ARRAY (não string)"),
        page_size: z
          .number()
          .optional()
          .describe("Número máximo de resultados (padrão 25)"),
      },
      async (args) => {
        try {
          // aceita filter/sorts como objeto ou como string JSON (o Claude às vezes stringifica)
          let filter = args.filter;
          if (typeof filter === "string") filter = JSON.parse(filter);
          let sorts = args.sorts;
          if (typeof sorts === "string") sorts = JSON.parse(sorts);

          const params = {
            data_source_id: args.data_source_id,
            page_size: args.page_size ?? 25,
          };
          if (filter) params.filter = filter;
          if (sorts) params.sorts = sorts;
          const res = await notion.dataSources.query(params);
          return ok(res.results);
        } catch (e) {
          return fail(e.message);
        }
      },
    ),
    tool(
      "get_database",
      "Retorna detalhes de um database do Notion pelo ID, incluindo a lista de data sources (usada para descobrir o data_source_id necessário em query_data_source).",
      {
        database_id: z.string().describe("ID do database"),
      },
      async (args) => {
        try {
          const db = await notion.databases.retrieve({
            database_id: args.database_id,
          });
          return ok({
            id: db.id,
            title: db.title,
            data_sources: db.data_sources,
          });
        } catch (e) {
          return fail(e.message);
        }
      },
    ),
    tool(
      "get_page",
      "Retorna as propriedades de uma página do Notion pelo ID.",
      {
        page_id: z.string().describe("ID da página"),
      },
      async (args) => {
        try {
          const res = await notion.pages.retrieve({ page_id: args.page_id });
          return ok(res);
        } catch (e) {
          return fail(e.message);
        }
      },
    ),
    tool(
      "get_page_content",
      "Retorna os blocos de conteúdo (children) de uma página do Notion.",
      {
        page_id: z.string().describe("ID da página"),
      },
      async (args) => {
        try {
          const res = await notion.blocks.children.list({
            block_id: args.page_id,
          });
          return ok(res.results);
        } catch (e) {
          return fail(e.message);
        }
      },
    ),
    tool(
      "create_page",
      "Cria uma nova página dentro de um data source (database) pai. Use para criar tarefas novas no banco 'Ações - Master'. As propriedades devem seguir o schema do data source.",
      {
        parent_data_source_id: z
          .string()
          .describe("ID do data source pai"),
        properties: z
          .record(z.any())
          .describe(
            "Propriedades Notion API. Ex: { 'Atividade': { title: [{ text: { content: 'Título' } }] }, 'Status': { status: { name: 'Inbox' } } }",
          ),
        content: z
          .array(z.any())
          .optional()
          .describe("Opcional: blocos de conteúdo (children)"),
      },
      async (args) => {
        try {
          const params = {
            parent: { data_source_id: args.parent_data_source_id },
            properties: args.properties,
          };
          if (args.content) params.children = args.content;
          const res = await notion.pages.create(params);
          return ok({ id: res.id, url: res.url, created: true });
        } catch (e) {
          return fail(e.message);
        }
      },
    ),
    tool(
      "update_page",
      "Atualiza propriedades de uma página existente do Notion.",
      {
        page_id: z.string().describe("ID da página a atualizar"),
        properties: z
          .record(z.any())
          .describe("Propriedades a atualizar no formato Notion API"),
      },
      async (args) => {
        try {
          const res = await notion.pages.update({
            page_id: args.page_id,
            properties: args.properties,
          });
          return ok({ id: res.id, updated: true });
        } catch (e) {
          return fail(e.message);
        }
      },
    ),
  ],
});

// --- Prompt + execução ---
const systemPrompt = `${skill}

---

IMPORTANTE - restrições desta fase:

VOCÊ SÓ TEM ACESSO A ESTAS 7 FERRAMENTAS (todas prefixadas mcp__notion__):
1. mcp__notion__search
2. mcp__notion__query_data_source
3. mcp__notion__get_database
4. mcp__notion__get_page
5. mcp__notion__get_page_content
6. mcp__notion__create_page
7. mcp__notion__update_page

ABSOLUTAMENTE PROIBIDO tentar usar:
- Qualquer ferramenta com prefixo mcp__claude_ai_* (elas vão falhar pedindo permissão interativa)
- Ferramentas built-in: Bash, Agent, ToolSearch, TodoWrite, Read, Write, Edit, Glob, Grep, WebFetch
- Ferramentas de Gmail, Google Calendar, Firecrawl, Canva, Zapier

Se você não conseguir completar uma etapa com as 7 ferramentas acima, simplesmente pule ela e continue com as outras. NUNCA tente usar ferramentas do Claude.ai como alternativa.

Escopo desta fase:
- Execute APENAS as etapas que dependem do Notion: Etapa 3 (Processar Tarefas), Etapa 4 (Planejamento do Dia), Etapa 5 (Lembrete SEBRAE) e o Resumo Final.
- IGNORE completamente as Etapas 1 (Gmail) e 2 (WhatsApp) — não tente acessá-las.
- Crie também uma tarefa placeholder no banco Ações - Master com título "Revisar Gmail e WhatsApp manualmente hoje", status Inbox, prazo hoje.
- Quando terminar todas as etapas, responda exatamente: "Revisão diária concluída." e pare.

---

IDs importantes (use diretamente, NÃO use search para achar estes):
- Ações - Master (database_id): 7f15aad5-243d-4192-951f-f8495748a53d
- Ações - Master (data_source_id): 267b0342-ff4c-4e14-bfe0-67e10e2318df
- Recorrentes (database_id): 9ff396fc-a750-4e94-8ebf-9a00bf27f905

Fluxo típico:
1. Para listar/filtrar tarefas de Ações - Master: use mcp__notion__query_data_source com data_source_id acima
2. Para criar tarefas em Ações - Master: use mcp__notion__create_page com parent_data_source_id acima
3. Para Recorrentes: primeiro use mcp__notion__get_database com o database_id acima para pegar o data_source_id dele, depois mcp__notion__query_data_source com esse id`;

console.log("🚀 Iniciando revisão diária...\n");

for await (const msg of query({
  prompt: "Execute a revisão diária de hoje seguindo as instruções do system prompt.",
  options: {
    systemPrompt,
    mcpServers: { notion: notionServer },
    allowedTools: [
      "mcp__notion__search",
      "mcp__notion__query_data_source",
      "mcp__notion__get_database",
      "mcp__notion__get_page",
      "mcp__notion__get_page_content",
      "mcp__notion__create_page",
      "mcp__notion__update_page",
    ],
    settingSources: [],
    model: "claude-sonnet-4-6",
  },
})) {
  if (msg.type === "system" && msg.subtype === "init") {
    console.log(
      "MCP servers:",
      JSON.stringify(msg.mcp_servers ?? [], null, 2),
    );
  }
  if (msg.type === "assistant") {
    for (const block of msg.message.content) {
      if (block.type === "text" && block.text.trim()) {
        console.log(block.text);
      } else if (block.type === "tool_use") {
        const preview = JSON.stringify(block.input).slice(0, 120);
        console.log(`→ ${block.name}(${preview}${preview.length >= 120 ? "..." : ""})`);
      }
    }
  }
  if (msg.type === "result") {
    console.log(`\n✅ Finalizado (subtype: ${msg.subtype})`);
    if (msg.subtype === "success" && msg.result) console.log(msg.result);
    break;
  }
}
