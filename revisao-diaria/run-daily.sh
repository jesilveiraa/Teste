#!/bin/bash
# Wrapper pra rodar a revisão diária.
# Faz "warmup" do claude CLI antes (pra garantir que os MCPs do Cowork
# — Notion, Gmail, Calendar — estejam conectados) e depois roda o script.

set -e

# PATH precisa incluir onde estão node e claude CLI
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin"

# Diretório do projeto (onde este script está)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "==================================================================="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Iniciando revisao-diaria wrapper"
echo "==================================================================="

# Etapa 1: warmup do claude CLI pra pré-carregar MCPs do Cowork
echo "[$(date '+%H:%M:%S')] Warmup do claude CLI..."
claude -p "ok" > /dev/null 2>&1 || echo "Warmup falhou (ignorando)"

# Etapa 2: rodar o script principal
echo "[$(date '+%H:%M:%S')] Rodando node index.js..."
node index.js

echo "==================================================================="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Finalizado"
echo "==================================================================="
