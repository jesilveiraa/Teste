import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { query } from "@anthropic-ai/claude-agent-sdk";

const __dirname = dirname(fileURLToPath(import.meta.url));
const skill = await readFile(join(__dirname, "skill-cloud.md"), "utf8");

// --- System prompt ---
const systemPrompt = `${skill}

---

IMPORTANTE - ferramentas disponíveis nesta fase:

Você tem acesso ao Notion (MCP standalone), Gmail e Google Calendar (MCPs do Cowork). Use apenas estas famílias:

Notion (mcp__Notion__*) — servidor standalone autenticado via NOTION_TOKEN:
- mcp__Notion__API-post-search — busca páginas e databases por texto
- mcp__Notion__API-post-database-query — consulta database com filtros (use para listar tarefas por status, prazo etc.)
- mcp__Notion__API-retrieve-a-page — recupera detalhes de uma página pelo ID
- mcp__Notion__API-create-a-page — cria nova página (tarefa) em um database
- mcp__Notion__API-update-page — atualiza propriedades de uma página; use { "archived": true } para arquivar/excluir
- mcp__Notion__API-append-block-children — adiciona conteúdo de texto ao corpo de uma página existente
- mcp__Notion__API-retrieve-block-children — lê os blocos de conteúdo de uma página

Gmail (mcp__claude_ai_Gmail__*) — MCP do Cowork:
- gmail_search_messages — busca mensagens
- gmail_read_message — lê o conteúdo de uma mensagem
- gmail_read_thread — lê uma thread completa
- gmail_create_draft — cria rascunhos de resposta (NÃO envia)
- gmail_list_labels — lista labels
- gmail_list_drafts — lista rascunhos

Google Calendar (mcp__claude_ai_Google_Calendar__*) — MCP do Cowork:
- gcal_list_events — lista eventos
- gcal_create_event — cria evento
- gcal_list_calendars — lista calendários
- gcal_find_my_free_time — procura horários livres

Regras gerais:
- Execute as Etapas 1 (Gmail), 2 (Deduplicação e Organização), 3 (Planejamento do Dia), 4 (Lembrete SEBRAE) e o Resumo Final.
- Na Etapa 1 (Gmail): crie rascunhos via gmail_create_draft (nunca envie). Crie eventos no Google Calendar via gcal_create_event para compromissos com data/hora identificados em e-mails. Crie tarefas no Notion (banco Ações - Master) para ações que não são eventos.
- IMPORTANTE sobre Prazo: só preencha o campo "Prazo" em tarefas novas se o e-mail mencionar EXPLICITAMENTE uma data (ex: "até sexta", "prazo dia 15", "precisamos até amanhã"). Se não houver prazo explícito, DEIXE o campo Prazo em branco — não chute "hoje" ou "amanhã". As únicas exceções onde o prazo HOJE é obrigatório são: (a) a tarefa SEBRAE, (b) o Resumo Final.

REGRA CRÍTICA sobre o planejamento do dia (Etapa 3):
O plano do dia NÃO é uma lista de todas as tarefas novas que você identificou. É baseado APENAS no que JÁ ESTÁ programado. A ordem de prioridade é fixa:
  1. AGENDA (Google Calendar) — compromissos fixos com horário. Estes são inegociáveis.
  2. TAREFAS RECORRENTES — as que se aplicam ao dia da semana de hoje.
  3. TAREFAS COM PRAZO HOJE — tarefas que já existiam no Notion COM prazo = hoje (ou atrasadas).
  4. SOMENTE SE SOBRAR TEMPO — sugestões do backlog (tarefas sem prazo ou Inbox).

As tarefas novas criadas na Etapa 1 desta revisão SÓ entram no plano do dia se foram criadas COM prazo = hoje (porque a fonte mencionava data explícita). Se uma tarefa nova foi criada SEM prazo, ela NÃO aparece no plano do dia — é backlog que Jéssica vai priorizar manualmente depois.

- Quando terminar todas as etapas, responda exatamente: "Revisão diária concluída." e pare.
- NÃO use ferramentas de Firecrawl, Zapier, Canva (fora do escopo).

---

IDs importantes dos bancos Notion:
- Ações - Master: https://www.notion.so/jesilveira/7f15aad5243d4192951ff8495748a53d
- Recorrentes: https://www.notion.so/jesilveira/9ff396fca7504e948ebf9a00bf27f905`;

console.log("🚀 Iniciando revisão diária (cloud)...\n");

for await (const msg of query({
  prompt: "Execute a revisão diária de hoje seguindo as instruções do system prompt.",
  options: {
    systemPrompt,
    mcpServers: {
      // Notion via servidor standalone oficial (@notionhq/notion-mcp-server).
      // Autentica via NOTION_TOKEN no env — não depende do claude CLI.
      // O servidor espera as credenciais no header Authorization via OPENAPI_MCP_HEADERS.
      Notion: {
        command: "npx",
        args: ["@notionhq/notion-mcp-server"],
        env: {
          OPENAPI_MCP_HEADERS: JSON.stringify({
            Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
            "Notion-Version": "2022-06-28",
          }),
        },
      },
      // Gmail e Google Calendar continuam via MCPs do Cowork.
      // Esses MCPs requerem o claude CLI autenticado com a conta da Jéssica
      // (claude login). No GitHub Actions, configurar via ANTHROPIC_API_KEY
      // com conta que tenha acesso ao Cowork, ou migrar para MCPs OAuth
      // standalone futuramente (ex: googleapis-mcp com service account).
    },
    // Auto-aprova ferramentas das três famílias permitidas.
    canUseTool: async (toolName, input) => {
      const allowed = [
        "mcp__Notion__",
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
      "mcp__Notion",
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
