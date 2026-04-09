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
      "Consulta um data source (database) do Notion e retorna suas páginas. Aceita filtros e ordenação no formato da Notion API. Use o id retornado por notion search com object=data_source.",
      {
        data_source_id: z.string().describe("ID do data source"),
        filter: z
          .record(z.any())
          .optional()
          .describe("Filtro no formato Notion API"),
        sorts: z.array(z.any()).optional().describe("Ordenação Notion API"),
        page_size: z
          .number()
          .optional()
          .describe("Número máximo de resultados (padrão 25)"),
      },
      async (args) => {
        try {
          const params = {
            data_source_id: args.data_source_id,
            page_size: args.page_size ?? 25,
          };
          if (args.filter) params.filter = args.filter;
          if (args.sorts) params.sorts = args.sorts;
          const res = await notion.dataSources.query(params);
          return ok(res.results);
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
- Apenas as ferramentas do Notion estão disponíveis nesta execução (prefixo mcp__notion__).
- Execute APENAS as etapas que dependem do Notion: Etapa 3 (Processar Tarefas), Etapa 4 (Planejamento do Dia), Etapa 5 (Lembrete SEBRAE) e o Resumo Final.
- IGNORE completamente as Etapas 1 (Gmail) e 2 (WhatsApp) — não tente acessá-las.
- Crie também uma tarefa placeholder no banco Ações - Master com título "Revisar Gmail e WhatsApp manualmente hoje", status Inbox, prazo hoje.
- Quando terminar todas as etapas, responda exatamente: "Revisão diária concluída." e pare.`;

console.log("🚀 Iniciando revisão diária...\n");

for await (const msg of query({
  prompt: "Execute a revisão diária de hoje seguindo as instruções do system prompt.",
  options: {
    systemPrompt,
    mcpServers: { notion: notionServer },
    allowedTools: ["mcp__notion__*"],
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
