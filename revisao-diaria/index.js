import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { Client as NotionClient } from "@notionhq/client";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const notion = new NotionClient({ auth: process.env.NOTION_TOKEN });

const __dirname = dirname(fileURLToPath(import.meta.url));
const skill = await readFile(join(__dirname, "skill.md"), "utf8");

// --- Definição das ferramentas Notion disponíveis para o Claude ---
const tools = [
  {
    name: "notion_search",
    description:
      "Busca páginas e data sources (databases) no Notion por título. Retorna lista com id, object (page/data_source), title e url.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Termo de busca pelo título" },
        filter_object: {
          type: "string",
          enum: ["page", "data_source"],
          description: "Opcional: filtrar só páginas ou só data sources (databases)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "notion_query_data_source",
    description:
      "Consulta um data source (database) do Notion e retorna suas páginas. Aceita filtros e ordenação no formato da Notion API. Use o id retornado por notion_search com object=data_source.",
    input_schema: {
      type: "object",
      properties: {
        data_source_id: { type: "string", description: "ID do data source" },
        filter: {
          type: "object",
          description: "Filtro no formato da Notion API (opcional)",
        },
        sorts: {
          type: "array",
          description: "Ordenação no formato da Notion API (opcional)",
        },
        page_size: {
          type: "number",
          description: "Número máximo de resultados (padrão 25)",
        },
      },
      required: ["data_source_id"],
    },
  },
  {
    name: "notion_get_page",
    description: "Retorna as propriedades de uma página do Notion pelo ID.",
    input_schema: {
      type: "object",
      properties: {
        page_id: { type: "string", description: "ID da página" },
      },
      required: ["page_id"],
    },
  },
  {
    name: "notion_get_page_content",
    description: "Retorna os blocos de conteúdo (children) de uma página do Notion.",
    input_schema: {
      type: "object",
      properties: {
        page_id: { type: "string", description: "ID da página" },
      },
      required: ["page_id"],
    },
  },
  {
    name: "notion_create_page",
    description:
      "Cria uma nova página dentro de um data source (database) pai. Use para criar tarefas novas no banco 'Ações - Master'. As propriedades devem seguir o schema do data source.",
    input_schema: {
      type: "object",
      properties: {
        parent_data_source_id: {
          type: "string",
          description: "ID do data source pai",
        },
        properties: {
          type: "object",
          description:
            "Propriedades da nova página no formato Notion API. Exemplo: { 'Atividade': { title: [{ text: { content: 'Título aqui' } }] }, 'Status': { status: { name: 'Inbox' } } }",
        },
        content: {
          type: "array",
          description:
            "Opcional: blocos de conteúdo (children) da página. Cada bloco no formato Notion API.",
        },
      },
      required: ["parent_data_source_id", "properties"],
    },
  },
  {
    name: "notion_update_page",
    description: "Atualiza propriedades de uma página existente do Notion.",
    input_schema: {
      type: "object",
      properties: {
        page_id: { type: "string", description: "ID da página a atualizar" },
        properties: {
          type: "object",
          description: "Propriedades a atualizar no formato Notion API",
        },
      },
      required: ["page_id", "properties"],
    },
  },
];

// --- Execução de uma tool call ---
async function executeTool(name, input) {
  const preview = JSON.stringify(input).slice(0, 120);
  console.log(`  → ${name}(${preview}${preview.length >= 120 ? "..." : ""})`);
  try {
    switch (name) {
      case "notion_search": {
        const params = { query: input.query };
        if (input.filter_object) {
          params.filter = { property: "object", value: input.filter_object };
        }
        const res = await notion.search(params);
        return res.results.map((r) => ({
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
      }
      case "notion_query_data_source": {
        const params = { data_source_id: input.data_source_id };
        if (input.filter) params.filter = input.filter;
        if (input.sorts) params.sorts = input.sorts;
        params.page_size = input.page_size ?? 25;
        const res = await notion.dataSources.query(params);
        return res.results;
      }
      case "notion_get_page":
        return await notion.pages.retrieve({ page_id: input.page_id });
      case "notion_get_page_content": {
        const res = await notion.blocks.children.list({ block_id: input.page_id });
        return res.results;
      }
      case "notion_create_page": {
        const params = {
          parent: { data_source_id: input.parent_data_source_id },
          properties: input.properties,
        };
        if (input.content) params.children = input.content;
        return await notion.pages.create(params);
      }
      case "notion_update_page":
        return await notion.pages.update({
          page_id: input.page_id,
          properties: input.properties,
        });
      default:
        throw new Error(`Tool desconhecida: ${name}`);
    }
  } catch (err) {
    console.error(`  ✗ Erro em ${name}: ${err.message}`);
    return { error: err.message };
  }
}

// --- Loop agêntico ---
const systemPrompt = `${skill}

---

IMPORTANTE - restrições desta fase:
- Apenas as ferramentas do Notion estão disponíveis nesta execução.
- Execute APENAS as etapas que dependem do Notion: Etapa 3 (Processar Tarefas), Etapa 4 (Planejamento do Dia), Etapa 5 (Lembrete SEBRAE) e o Resumo Final.
- IGNORE completamente as Etapas 1 (Gmail) e 2 (WhatsApp) — não tente acessá-las.
- Crie também uma tarefa placeholder no banco Ações - Master com título "Revisar Gmail e WhatsApp manualmente hoje", status Inbox, prazo hoje.
- Quando terminar todas as etapas, responda exatamente: "Revisão diária concluída." e pare.`;

const messages = [
  {
    role: "user",
    content:
      "Execute a revisão diária de hoje seguindo as instruções do system prompt.",
  },
];

console.log("🚀 Iniciando revisão diária...\n");

let turn = 0;
const maxTurns = 30;

while (turn < maxTurns) {
  turn++;
  console.log(`--- Turno ${turn} ---`);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    tools,
    messages,
  });

  messages.push({ role: "assistant", content: response.content });

  for (const block of response.content) {
    if (block.type === "text" && block.text.trim()) {
      console.log(block.text);
    }
  }

  if (response.stop_reason !== "tool_use") {
    console.log(`\n✅ Finalizado (stop_reason: ${response.stop_reason})`);
    break;
  }

  const toolResults = [];
  for (const block of response.content) {
    if (block.type === "tool_use") {
      const result = await executeTool(block.name, block.input);
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(result),
      });
    }
  }
  messages.push({ role: "user", content: toolResults });
}

if (turn >= maxTurns) {
  console.error(`\n⚠ Atingiu o limite de ${maxTurns} turnos sem terminar.`);
  process.exit(1);
}
