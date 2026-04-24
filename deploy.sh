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
VPS_PASS="${VPS_PASS:-}"
REMOTE="${VPS_USER}@${VPS_HOST}"
SSH_OPTS="-o StrictHostKeyChecking=no -o PreferredAuthentications=password -o PubkeyAuthentication=no"

if [ -z "$VPS_PASS" ]; then
  echo "❌ Defina VPS_PASS no ambiente antes de executar o deploy."
  exit 1
fi

run_remote() {
  local command="$1"

  if command -v sshpass >/dev/null 2>&1; then
    sshpass -p "$VPS_PASS" ssh $SSH_OPTS "$REMOTE" "$command"
    return
  fi

  if command -v expect >/dev/null 2>&1; then
    expect <<EOF
set timeout -1
spawn ssh $SSH_OPTS $REMOTE "$command"
expect {
  "password:" {
    send -- "$VPS_PASS\r"
    exp_continue
  }
  eof
}
EOF
    return
  fi

  echo "❌ Instale sshpass ou expect para executar o deploy."
  exit 1
}

sync_files() {
  if command -v sshpass >/dev/null 2>&1; then
    rsync -avz \
      --exclude 'node_modules' \
      --exclude '.git' \
      --exclude 'data' \
      --exclude '.env' \
      --exclude '.env.production' \
      --exclude 'data/*.db' \
      --exclude 'data/*.db-wal' \
      --exclude 'data/*.db-shm' \
      -e "sshpass -p '$VPS_PASS' ssh $SSH_OPTS" \
      ./ "$REMOTE:$VPS_PATH/"
    return
  fi

  if command -v expect >/dev/null 2>&1; then
    expect <<EOF
set timeout -1
spawn rsync -avz \
  --exclude node_modules \
  --exclude .git \
  --exclude data \
  --exclude .env \
  --exclude .env.production \
  --exclude data/*.db \
  --exclude data/*.db-wal \
  --exclude data/*.db-shm \
  -e "ssh $SSH_OPTS" \
  ./ $REMOTE:$VPS_PATH/
expect {
  "password:" {
    send -- "$VPS_PASS\r"
    exp_continue
  }
  eof
}
EOF
    return
  fi

  echo "❌ Instale sshpass ou expect para executar o deploy."
  exit 1
}

echo "🔨 Gerando build de produção..."
npm run build

echo "📦 Enviando arquivos para VPS (excluindo data/ e node_modules/)..."
sync_files

echo "📦 Instalando dependências na VPS..."
run_remote "cd $VPS_PATH && npm install --production"

echo "♻️  Reiniciando servidor licensing-pro via PM2..."
run_remote "pm2 restart licensing-pro"

echo ""
echo "✅ Deploy concluído com sucesso!"
echo "🌐 Acesse: https://app.licensing.arbtechinfo.tech"
