# Revisão Diária — Automação (Fase 1)

Script Node.js que executa a rotina de revisão diária da Jéssica usando a **Anthropic Messages API** com tool use + a **Notion API**. A skill em `skill.md` é passada como system prompt e o Claude decide quais ferramentas (Notion) chamar.

## O que esta Fase 1 faz

- Lê `skill.md` como system prompt
- Conecta à Notion API diretamente via `@notionhq/client`
- Claude (via Messages API) executa as etapas **3, 4, 5 e Resumo Final** da skill (as que dependem só do Notion)
- Cria uma tarefa placeholder *"Revisar Gmail e WhatsApp manualmente hoje"* no Notion

Gmail, Google Calendar e WhatsApp ficam para fases seguintes.

## Pré-requisitos

- **Node.js 20 ou superior** — verifique com `node -v`
- Conta na **Anthropic** com crédito / API key
- Conta no **Notion** com permissão para criar Integrations

## Setup passo a passo

### 1. Clonar e instalar

No seu Mac, abra o Terminal e execute:

```bash
cd ~
git clone https://github.com/jesilveiraa/Teste.git
cd Teste/revisao-diaria
npm install
```

### 2. Obter a chave da Anthropic

1. Vá em https://console.anthropic.com
2. Faça login
3. Menu lateral → **API Keys** → **Create Key**
4. Copie o valor (começa com `sk-ant-...`) — **guarde, ela só aparece uma vez**

### 3. Criar a integration do Notion

1. Vá em https://www.notion.so/profile/integrations
2. Clique em **New integration**
3. Nome: `Revisao Diaria`
4. Type: **Internal**
5. Associated workspace: o seu
6. **Save**
7. Na aba **Configuration**, copie o valor de **Internal Integration Secret** (começa com `ntn_...`)

### 4. Conectar a integration às páginas do Notion

⚠️ **Essa é a parte que mais quebra pra iniciante.** Sem esse passo, o token funciona mas o Notion retorna vazio em tudo.

1. Abra a página **Ações - Master** no Notion (https://www.notion.so/jesilveira/7f15aad5243d4192951ff8495748a53d)
2. No canto superior direito, clique em **...** → **Connections** → **Connect to** → procure `Revisao Diaria` → **Confirm**
3. Repita para a página de recorrentes: https://www.notion.so/jesilveira/9ff396fca7504e948ebf9a00bf27f905

### 5. Criar o arquivo .env

```bash
cp .env.example .env
```

Abra `.env` no editor (pode ser `nano .env` no Terminal) e cole os dois valores:

```
ANTHROPIC_API_KEY=sk-ant-...
NOTION_TOKEN=ntn_...
```

Salve o arquivo. **Nunca** faça commit do `.env` (já está no `.gitignore`).

## Rodando

### Smoke test (recomendado primeira vez)

Antes de rodar a revisão completa, execute o smoke test que só verifica se os tokens estão válidos e se as duas APIs respondem:

```bash
npm run smoke-test
```

Saída esperada:
```
Iniciando smoke test...
ANTHROPIC_API_KEY presente: true
NOTION_TOKEN presente: true

--- Testando Notion API ---
Resultados encontrados: 1
 - database : Ações - Master

--- Testando Anthropic API ---
Resposta Claude: API funcionando.

✅ Smoke test concluído com sucesso!
```

Se der erro aqui, o problema é token/rede e não vale rodar o principal.

### Execução normal

```bash
npm start
```

ou

```bash
node index.js
```

## Como saber que funcionou

Você verá no terminal, em ordem:

1. `🚀 Iniciando revisão diária...`
2. `--- Turno 1 ---` e então chamadas como `→ notion_search(...)`, `→ notion_query_database(...)` enquanto o Claude explora o workspace
3. Chamadas `→ notion_create_page(...)` quando ele criar as tarefas
4. Texto final: `✅ Finalizado` seguido de `Revisão diária concluída.`

No Notion, no banco **Ações - Master**, devem aparecer:

- ✅ `Revisar Gmail e WhatsApp manualmente hoje` (placeholder)
- ✅ `Verificar SEBRAE — aceite de proposta`
- ✅ `Resumo do dia de hoje — DD/MM/AAAA` (com o resumo no corpo)

## Problemas comuns

- **`Connect Timeout` ou `fetch failed`** → rede bloqueando `api.notion.com` ou `api.anthropic.com`. Se estiver atrás de firewall corporativo, teste em outra rede.
- **Notion retorna 0 resultados ou tarefas não aparecem** → a integration não está conectada à página `Ações - Master`. Volte ao passo 4.
- **`Cannot use import statement outside a module`** → `package.json` sem `"type": "module"`.
- **`401 authentication_error` da Anthropic** → `ANTHROPIC_API_KEY` errada ou sem crédito na conta.
- **`401 unauthorized` do Notion** → `NOTION_TOKEN` errado.

## Próximas fases

- **Fase 2:** Adicionar ferramentas Gmail + Google Calendar (via tool use também)
- **Fase 3:** Deploy no Railway + agendamento no n8n Cloud
- **Fase 4 (opcional):** Integrar `whatsapp-mcp`

## Estrutura do código

- `index.js` — script principal: loop agêntico (Claude decide tool calls, nós executamos, devolvemos resultados, repete)
- `skill.md` — a skill original; é passada como system prompt ao Claude
- `smoke-test.js` — verifica se as duas APIs estão acessíveis e os tokens funcionam
- `package.json` — dependências e scripts npm
- `.env.example` — template dos tokens (você copia para `.env` e preenche)
