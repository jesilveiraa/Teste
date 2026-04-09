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

IMPORTANTE - ferramentas disponíveis nesta fase:

Você tem acesso às ferramentas do Cowork via MCPs já conectados. Use apenas estas famílias:

Notion (mcp__claude_ai_Notion__*):
- notion-search — busca páginas/databases
- notion-fetch — retrieve detalhes por URL ou ID
- notion-create-pages — cria novas páginas (tarefas)
- notion-update-page — atualiza propriedades de uma página
- notion-query-database-view — consulta view de database

Gmail (mcp__claude_ai_Gmail__*):
- gmail_search_messages — busca mensagens
- gmail_read_message — lê o conteúdo de uma mensagem
- gmail_read_thread — lê uma thread completa
- gmail_create_draft — cria rascunhos de resposta (NÃO envia)
- gmail_list_labels — lista labels
- gmail_list_drafts — lista rascunhos

Google Calendar (mcp__claude_ai_Google_Calendar__*):
- gcal_list_events — lista eventos
- gcal_create_event — cria evento
- gcal_list_calendars — lista calendários
- gcal_find_my_free_time — procura horários livres

Regras:
- Execute as Etapas 1 (Gmail), 3 (Processar Tarefas no Notion), 4 (Planejamento do Dia com Calendar+Notion), 5 (Lembrete SEBRAE) e o Resumo Final.
- IGNORE a Etapa 2 (WhatsApp) — ainda não temos integração com WhatsApp Web. Em vez disso, crie uma tarefa placeholder no banco Ações - Master com título "Revisar WhatsApp manualmente hoje", status Inbox, prazo hoje.
- Na Etapa 1: crie rascunhos no Gmail via gmail_create_draft (nunca envie). Crie eventos no Google Calendar via gcal_create_event para compromissos identificados em e-mails. Crie tarefas no Notion (banco Ações - Master) para ações que não são eventos.
- Quando terminar todas as etapas, responda exatamente: "Revisão diária concluída." e pare.
- NÃO use ferramentas de Firecrawl, Zapier, Canva (fora do escopo).

---

IDs importantes dos bancos Notion:
- Ações - Master: https://www.notion.so/jesilveira/7f15aad5243d4192951ff8495748a53d
- Recorrentes: https://www.notion.so/jesilveira/9ff396fca7504e948ebf9a00bf27f905`;

console.log("🚀 Iniciando revisão diária...\n");

for await (const msg of query({
  prompt: "Execute a revisão diária de hoje seguindo as instruções do system prompt.",
  options: {
    systemPrompt,
    // Auto-aprova ferramentas do Notion, Gmail e Google Calendar (todas do
    // MCP claude_ai). Sem isso o CLI pede permissão interativa que trava.
    canUseTool: async (toolName, input) => {
      const allowed = [
        "mcp__claude_ai_Notion__",
        "mcp__claude_ai_Gmail__",
        "mcp__claude_ai_Google_Calendar__",
      ];
      if (allowed.some((prefix) => toolName.startsWith(prefix))) {
        return { behavior: "allow", updatedInput: input };
      }
      return {
        behavior: "deny",
        message: `Ferramenta ${toolName} fora do escopo desta fase.`,
      };
    },
    allowedTools: [
      "mcp__claude_ai_Notion",
      "mcp__claude_ai_Gmail",
      "mcp__claude_ai_Google_Calendar",
    ],
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
