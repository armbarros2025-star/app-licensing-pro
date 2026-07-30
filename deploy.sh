#!/bin/bash
# =====================================================
# DEPLOY SEGURO - app-licensing-pro
# VPS: root@72.61.63.197
# ATENÇÃO: NUNCA sobrescreve a pasta data/ (banco de dados)
# =====================================================
set -e

VPS_USER="${VPS_USER:-root}"
VPS_HOST="${VPS_HOST:-72.61.63.197}"
VPS_PATH="${VPS_PATH:-/var/www/app-licensing}"
REMOTE="${VPS_USER}@${VPS_HOST}"
SSH_OPTS="-o StrictHostKeyChecking=accept-new -o BatchMode=yes"

run_remote() {
  local command="$1"

  ssh $SSH_OPTS "$REMOTE" "$command"
}

sync_files() {
  rsync -avz \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.codex' \
    --exclude 'data' \
    --exclude '.env' \
    --exclude '.env.production' \
    --exclude 'data/*.db' \
    --exclude 'data/*.db-wal' \
    --exclude 'data/*.db-shm' \
    -e "ssh $SSH_OPTS" \
    ./ "$REMOTE:$VPS_PATH/"
}

echo "🔨 Gerando build de produção..."
npm run build

echo "📦 Enviando arquivos para VPS (excluindo data/ e node_modules/)..."
sync_files

echo "📦 Instalando dependências auditadas na VPS..."
run_remote "cd $VPS_PATH && npm ci --omit=dev"

echo "♻️  Reiniciando servidor licensing-pro via PM2..."
run_remote "pm2 restart licensing-pro"

echo ""
echo "✅ Deploy concluído com sucesso!"
echo "🌐 Acesse: https://app.licensing.arbtechinfo.tech"
