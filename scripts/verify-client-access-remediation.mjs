import { createRequire } from 'node:module';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import net from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporaryRoot = mkdtempSync(path.join(tmpdir(), 'licensing-pro-client-access-'));
let server;
let serverOutput = '';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const reservePort = () => new Promise((resolve, reject) => {
  const probe = net.createServer();
  probe.once('error', reject);
  probe.listen(0, '127.0.0.1', () => {
    const address = probe.address();
    const port = typeof address === 'object' && address ? address.port : null;
    probe.close(error => error ? reject(error) : resolve(port));
  });
});

const port = await reservePort();
assert(typeof port === 'number', 'Could not reserve an isolated test port.');
const baseUrl = `http://127.0.0.1:${port}`;

const waitForHealth = async () => {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // The temporary server is still starting.
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`Temporary server did not become healthy within 30 seconds. ${serverOutput}`);
};

const startTemporaryServer = async () => {
  server = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], {
    cwd: temporaryRoot,
    env: { ...process.env, NODE_ENV: 'test', PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  server.stdout.on('data', chunk => { serverOutput += chunk; });
  server.stderr.on('data', chunk => { serverOutput += chunk; });
  await waitForHealth();
};

const stopTemporaryServer = async () => {
  if (!server || server.killed || server.exitCode !== null) return;
  server.kill('SIGTERM');
  await once(server, 'exit');
};

try {
  const copy = spawnSync('rsync', [
    '-a',
    '--exclude', 'data',
    '--exclude', 'node_modules',
    '--exclude', '.git',
    '--exclude', 'dist',
    '--exclude', '.env',
    '--exclude', '.env.*',
    `${sourceRoot}/`,
    `${temporaryRoot}/`
  ], { encoding: 'utf8' });
  assert(copy.status === 0, `Could not create isolated test copy: ${copy.stderr}`);

  symlinkSync(path.join(sourceRoot, 'node_modules'), path.join(temporaryRoot, 'node_modules'));
  await startTemporaryServer();

  const requireFromApp = createRequire(path.join(temporaryRoot, 'package.json'));
  const Database = requireFromApp('better-sqlite3');
  const clientAccess = await fetch(`${baseUrl}/api/auth/client-access`, { method: 'POST' });
  const clientAccessBody = await clientAccess.json();
  assert(clientAccess.ok && clientAccessBody.token, `Expected client access to issue a session, got ${clientAccess.status}.`);
  assert(clientAccessBody.user?.isClientAccess === true, 'Client access response must identify the read-only visitor session.');

  const clientHeaders = { Authorization: `Bearer ${clientAccessBody.token}` };
  const clientLicenses = await fetch(`${baseUrl}/api/licenses`, { headers: clientHeaders });
  const clientLicensesBody = await clientLicenses.json();
  assert(clientLicenses.ok && Array.isArray(clientLicensesBody), `Expected client license list to succeed, got ${clientLicenses.status}.`);
  assert(clientLicensesBody.every(license => !Object.hasOwn(license, 'notes') && !Object.hasOwn(license, 'feeAmount')), 'Client license list must omit internal notes and fees.');

  const clientCompanies = await fetch(`${baseUrl}/api/companies`, { headers: clientHeaders });
  const clientCompaniesBody = await clientCompanies.json();
  assert(clientCompanies.ok && Array.isArray(clientCompaniesBody), `Expected client company list to succeed, got ${clientCompanies.status}.`);
  assert(clientCompaniesBody.every(company => !Object.hasOwn(company, 'cnpj') && !Object.hasOwn(company, 'renewalLinks')), 'Client company list must omit CNPJ and renewal links.');

  const blockedSettings = await fetch(`${baseUrl}/api/settings`, { headers: clientHeaders });
  assert(blockedSettings.status === 403, `Expected client settings request to be blocked, got ${blockedSettings.status}.`);
  const blockedExpenses = await fetch(`${baseUrl}/api/telecom-expenses`, { headers: clientHeaders });
  assert(blockedExpenses.status === 403, `Expected client telecom request to be blocked, got ${blockedExpenses.status}.`);
  const blockedWrite = await fetch(`${baseUrl}/api/licenses`, {
    method: 'POST',
    headers: { ...clientHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  assert(blockedWrite.status === 403, `Expected client license write to be blocked, got ${blockedWrite.status}.`);
  const directClientLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'clientes@arbtechinfo.net', password: 'not-used' })
  });
  assert(directClientLogin.status === 403, `Expected direct client credential login to be blocked, got ${directClientLogin.status}.`);

  const normalLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'armando@arbtechinfo.com.br', password: 'change-me-local-only' })
  });
  const normalLoginBody = await normalLogin.json();
  assert(normalLogin.ok && normalLoginBody.token, `Expected normal login to succeed, got ${normalLogin.status}.`);

  const normalRequest = await fetch(`${baseUrl}/api/licenses`, {
    headers: { Authorization: `Bearer ${normalLoginBody.token}` }
  });
  assert(normalRequest.ok, `Expected normal authenticated request to succeed, got ${normalRequest.status}.`);

  const auditDatabase = new Database(path.join(temporaryRoot, 'data', 'database.db'));
  const loginAudit = auditDatabase.prepare(`
    SELECT entityId FROM audit_logs WHERE action = 'auth.client_access' ORDER BY datetime(createdAt) DESC LIMIT 1
  `).get();
  assert(loginAudit?.entityId?.startsWith('sha256:'), 'Client access audit record must use a hashed session identifier.');
  assert(loginAudit.entityId !== clientAccessBody.token, 'Client access audit record must not contain the raw session token.');

  const legacyAuditId = 'legacy-audit-entry';
  const legacyRawToken = '11111111-1111-4111-8111-111111111111';
  auditDatabase.prepare(`
    INSERT INTO audit_logs (id, action, entityType, entityId, summary, details, createdAt)
    VALUES (?, 'auth.login', 'session', ?, 'Legacy login', '{}', ?)
  `).run(legacyAuditId, legacyRawToken, new Date().toISOString());
  auditDatabase.close();

  await stopTemporaryServer();
  await startTemporaryServer();

  const redactedAuditDatabase = new Database(path.join(temporaryRoot, 'data', 'database.db'));
  const redactedLegacyAudit = redactedAuditDatabase.prepare('SELECT entityId FROM audit_logs WHERE id = ?').get(legacyAuditId);
  redactedAuditDatabase.close();
  assert(redactedLegacyAudit?.entityId?.startsWith('sha256:'), 'Legacy session audit record must be redacted at startup.');
  assert(redactedLegacyAudit.entityId !== legacyRawToken, 'Legacy session audit record must not retain the raw token.');

  console.log('Client access verified: anonymous visitor is read-only, sensitive APIs are blocked, normal login is preserved, and session audit identifiers are redacted.');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await stopTemporaryServer();
  rmSync(temporaryRoot, { recursive: true, force: true });
}
