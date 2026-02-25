#!/bin/bash
# =====================================================
# DEPLOY SEGURO - app-licensing-pro
# VPS: root@72.61.63.197
# ATENÇÃO: NUNCA sobrescreve a pasta data/ (banco de dados)
# =====================================================
set -e

VPS_USER="root"
VPS_HOST="72.61.63.197"
VPS_PASS="B075@#ax/980tec"
VPS_PATH="/var/www/app-licensing"
SSH="sshpass -p '$VPS_PASS' ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST"

echo "🔨 Gerando build de produção..."
npm run build

echo "📦 Enviando arquivos para VPS (excluindo data/ e node_modules/)..."
rsync -avz \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'data' \
  --exclude '.env' \
  --exclude '.env.production' \
  --exclude 'data/*.db' \
  --exclude 'data/*.db-wal' \
  --exclude 'data/*.db-shm' \
  -e "sshpass -p '$VPS_PASS' ssh -o StrictHostKeyChecking=no" \
  ./ $VPS_USER@$VPS_HOST:$VPS_PATH/

echo "📦 Instalando dependências na VPS..."
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST \
  "cd $VPS_PATH && npm install --production"

echo "♻️  Reiniciando servidor licensing-pro via PM2..."
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST \
  "pm2 restart licensing-pro"

echo ""
echo "✅ Deploy concluído com sucesso!"
echo "🌐 Acesse: https://app.licensing.arbtechinfo.com.br"
