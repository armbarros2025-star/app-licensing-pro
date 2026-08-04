#!/bin/bash
# =====================================================
# DEPLOY SEGURO - app-licensing-pro
# VPS: root@72.61.63.197
# ATENÇÃO: NUNCA sobrescreve a pasta data/ (banco de dados)
# =====================================================
set -euo pipefail

VPS_USER="${VPS_USER:-root}"
VPS_HOST="${VPS_HOST:-72.61.63.197}"
VPS_PATH="${VPS_PATH:-/var/www/app-licensing}"
REMOTE="${VPS_USER}@${VPS_HOST}"
SSH_KEY="${SSH_KEY:-/Users/arbtechinfo/.ssh/licensing-pro-deploy_ed25519}"
SSH_OPTS="-i $SSH_KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o BatchMode=yes"
RELEASE_ID="${RELEASE_ID:-$(date +%Y%m%d-%H%M%S)}"
BACKUP_DIR="/var/backups/app-licensing/${RELEASE_ID}"

run_remote() {
  local command="$1"

  ssh $SSH_OPTS "$REMOTE" "$command"
}

wait_for_remote_health() {
  local attempt

  for attempt in {1..15}; do
    if run_remote "curl -fsS http://127.0.0.1:3000/api/health >/dev/null"; then
      return 0
    fi
    sleep 2
  done

  return 1
}

backup_remote_release() {
  run_remote "set -e; test -d '$VPS_PATH'; test -f '$VPS_PATH/data/database.db'; mkdir -p '$BACKUP_DIR'; cd '$VPS_PATH'; node --input-type=module -e \"import Database from 'better-sqlite3'; const db = new Database('data/database.db'); await db.backup('$BACKUP_DIR/database.db'); const integrity = db.pragma('integrity_check', { simple: true }); const companies = db.prepare('SELECT COUNT(*) AS count FROM companies').get().count; const licenses = db.prepare('SELECT COUNT(*) AS count FROM licenses').get().count; db.close(); if (integrity !== 'ok') throw new Error('SQLite integrity check failed: ' + integrity); console.log(JSON.stringify({ integrity, companies, licenses }));\"; tar -czf '$BACKUP_DIR/app-files.tar.gz' --exclude='./data' --exclude='./node_modules' --exclude='./.env*' -C '$VPS_PATH' .; test -s '$BACKUP_DIR/database.db'; test -s '$BACKUP_DIR/app-files.tar.gz'"
}

sync_runtime_files() {
  rsync -avz --delete -e "ssh $SSH_OPTS" \
    dist/ "$REMOTE:$VPS_PATH/dist/"
  rsync -avz -e "ssh $SSH_OPTS" \
    server.ts package.json package-lock.json "$REMOTE:$VPS_PATH/"
}

echo "🔎 Validando acesso seguro ao VPS..."
test -f "$SSH_KEY"
run_remote "test -d '$VPS_PATH' && command -v node >/dev/null && command -v pm2 >/dev/null"

echo "🔨 Validando e gerando build de produção..."
npm run lint
npm run build
node scripts/verify-client-access-remediation.mjs

echo "💾 Criando backup consistente em $BACKUP_DIR..."
backup_remote_release

echo "📦 Enviando somente build e arquivos de execução..."
sync_runtime_files

echo "📦 Instalando dependências auditadas na VPS..."
run_remote "cd $VPS_PATH && npm ci --omit=dev"

echo "🔐 Invalidando sessões antigas após o backup..."
run_remote "cd $VPS_PATH && node --input-type=module -e \"import Database from 'better-sqlite3'; const db = new Database('data/database.db'); db.prepare('DELETE FROM sessions').run(); db.close();\""

echo "♻️  Reiniciando servidor licensing-pro via PM2..."
run_remote "pm2 restart licensing-pro"

echo "🩺 Validando saúde, segurança e migração..."
if ! wait_for_remote_health; then
  echo "Falha: licensing-pro não respondeu após o reinício." >&2
  echo "Rollback disponível em $BACKUP_DIR" >&2
  exit 1
fi
run_remote "set -e; cd '$VPS_PATH'; node --input-type=module -e \"import Database from 'better-sqlite3'; const db = new Database('data/database.db', { readonly: true }); const telecomColumns = db.prepare('PRAGMA table_info(telecom_expenses)').all().map(column => column.name); const licenseColumns = db.prepare('PRAGMA table_info(licenses)').all().map(column => column.name); const integrity = db.pragma('integrity_check', { simple: true }); db.close(); if (integrity !== 'ok' || !telecomColumns.includes('companyName') || telecomColumns.includes('companyId') || !licenseColumns.includes('feeAmount')) throw new Error('Database schema verification failed'); console.log(JSON.stringify({ integrity, telecomColumns, licenseColumns }));\""

CLIENT_ACCESS_STATUS="$(curl -sS -o /dev/null -w '%{http_code}' -X POST https://app.licensing.arbtechinfo.tech/api/auth/client-access)"
if [ "$CLIENT_ACCESS_STATUS" != "200" ]; then
  echo "Falha: acesso público controlado retornou HTTP $CLIENT_ACCESS_STATUS, esperado 200." >&2
  echo "Rollback disponível em $BACKUP_DIR" >&2
  exit 1
fi

echo ""
echo "✅ Deploy concluído com sucesso!"
echo "🌐 Acesse: https://app.licensing.arbtechinfo.tech"
echo "↩️  Backup para rollback: $BACKUP_DIR"
