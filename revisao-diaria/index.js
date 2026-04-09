import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { query } from "@anthropic-ai/claude-agent-sdk";

const __dirname = dirname(fileURLToPath(import.meta.url));
const skill = await readFile(join(__dirname, "skill.md"), "utf8");

// --- System prompt ---
const systemPrompt = `${skill}

---

IMPORTANTE - restrições desta fase:

Você tem acesso às ferramentas do Notion via MCP Cowork. Os nomes das ferramentas começam com mcp__claude_ai_Notion__ e incluem:
- mcp__claude_ai_Notion__notion-search — busca páginas/databases
- mcp__claude_ai_Notion__notion-fetch — retrieve detalhes por URL ou ID
- mcp__claude_ai_Notion__notion-create-pages — cria novas páginas (tarefas)
- mcp__claude_ai_Notion__notion-update-page — atualiza propriedades de uma página
- mcp__claude_ai_Notion__notion-query-database-view — consulta view de database

Regras:
- Execute APENAS as etapas que dependem do Notion: Etapa 3 (Processar Tarefas), Etapa 4 (Planejamento do Dia), Etapa 5 (Lembrete SEBRAE) e o Resumo Final.
- IGNORE completamente as Etapas 1 (Gmail) e 2 (WhatsApp) — não tente acessá-las.
- Crie uma tarefa placeholder no banco Ações - Master com título "Revisar Gmail e WhatsApp manualmente hoje", status Inbox, prazo hoje.
- Quando terminar todas as etapas, responda exatamente: "Revisão diária concluída." e pare.
- NÃO use ferramentas de Gmail, Google Calendar, Firecrawl, Zapier, Canva (elas não fazem parte do escopo desta fase).

---

IDs importantes dos bancos:
- Ações - Master: https://www.notion.so/jesilveira/7f15aad5243d4192951ff8495748a53d
- Recorrentes: https://www.notion.so/jesilveira/9ff396fca7504e948ebf9a00bf27f905`;

console.log("🚀 Iniciando revisão diária...\n");

for await (const msg of query({
  prompt: "Execute a revisão diária de hoje seguindo as instruções do system prompt.",
  options: {
    systemPrompt,
    // Auto-aprova qualquer ferramenta do MCP claude_ai (Notion/Gmail/Calendar
    // etc.). Sem isso o CLI pede permissão interativa que trava o script.
    canUseTool: async (toolName, input) => {
      if (toolName.startsWith("mcp__claude_ai_Notion__")) {
        return { behavior: "allow", updatedInput: input };
      }
      return {
        behavior: "deny",
        message: `Ferramenta ${toolName} fora do escopo desta fase (só Notion permitido).`,
      };
    },
    allowedTools: ["mcp__claude_ai_Notion"],
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
        console.log(
          `→ ${block.name}(${preview}${preview.length >= 120 ? "..." : ""})`,
        );
      }
    }
  }
  if (msg.type === "result") {
    console.log(`\n✅ Finalizado (subtype: ${msg.subtype})`);
    if (msg.subtype === "success" && msg.result) console.log(msg.result);
    break;
  }
}
