#!/bin/bash
# Wrapper pra rodar a revisão diária.
# Faz "warmup" do claude CLI e do Python MCP server do WhatsApp antes
# de chamar o node index.js, pra evitar timeout na inicialização de MCPs.

set -e

# PATH precisa incluir onde estão node, claude CLI e uv
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin"

# Diretório do projeto (onde este script está)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "==================================================================="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Iniciando revisao-diaria wrapper"
echo "==================================================================="

# Etapa 1: warmup do claude CLI pra pré-carregar MCPs do Cowork
# (Notion, Gmail, Google Calendar — esses conectam async da nuvem
# e sem warmup às vezes não carregam a tempo)
echo "[$(date '+%H:%M:%S')] Warmup do claude CLI..."
claude -p "ok" > /dev/null 2>&1 || echo "Warmup do claude falhou (ignorando)"

# Etapa 2: warmup do Python MCP server do WhatsApp
# (uv run main.py é lento na primeira chamada; pré-aquecer evita timeout
# quando o Claude Agent SDK spawna o MCP)
echo "[$(date '+%H:%M:%S')] Warmup do WhatsApp MCP server..."
WHATSAPP_MCP_DIR="/Users/jesilveira/whatsapp-mcp-server/whatsapp-mcp-server"
if [ -d "$WHATSAPP_MCP_DIR" ]; then
    (echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"warmup","version":"1.0"}}}' \
        | WHATSAPP_DB_PATH="/Users/jesilveira/store/messages.db" \
          timeout 15 uv run --directory "$WHATSAPP_MCP_DIR" main.py > /dev/null 2>&1) \
        || echo "Warmup do WhatsApp MCP falhou (ignorando)"
fi

# Etapa 3: rodar o script principal
echo "[$(date '+%H:%M:%S')] Rodando node index.js..."
node index.js

echo "==================================================================="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Finalizado"
echo "==================================================================="
