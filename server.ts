
import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import Database from "better-sqlite3";
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "database.db");
const createId = () => randomUUID();
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const SCRYPT_PREFIX = 'scrypt';
const hashPasswordLegacy = (password: string) => createHash('sha256').update(password).digest('hex');
const isLegacySha256 = (storedHash: string) =>
  /^[a-f0-9]{64}$/i.test(storedHash) || storedHash.startsWith('sha256$');
const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${SCRYPT_PREFIX}$${salt}$${derived}`;
};
const verifyPassword = (password: string, storedHash: string): { ok: boolean; needsRehash: boolean } => {
  if (!storedHash) return { ok: false, needsRehash: false };

  if (storedHash.startsWith(`${SCRYPT_PREFIX}$`)) {
    const [prefix, salt, derived] = storedHash.split('$');
    if (prefix !== SCRYPT_PREFIX || !salt || !derived) return { ok: false, needsRehash: false };

    const candidate = scryptSync(password, salt, 64);
    const stored = Buffer.from(derived, 'hex');
    if (candidate.length !== stored.length) return { ok: false, needsRehash: false };
    return { ok: timingSafeEqual(candidate, stored), needsRehash: false };
  }

  if (isLegacySha256(storedHash)) {
    const normalized = storedHash.startsWith('sha256$') ? storedHash.slice('sha256$'.length) : storedHash;
    const ok = hashPasswordLegacy(password) === normalized;
    return { ok, needsRehash: ok };
  }

  return { ok: false, needsRehash: false };
};
const ADMIN_EMAIL = 'armando@arbtechinfo.com.br';
const ADMIN_DEFAULT_PASSWORD = '49371028';
const LOGIN_WINDOW_MS = 1000 * 60 * 15;
const LOGIN_LOCK_TIERS = [
  { threshold: 5, lockMs: 1000 * 60 * 15 },
  { threshold: 8, lockMs: 1000 * 60 * 60 },
  { threshold: 12, lockMs: 1000 * 60 * 60 * 24 }
];
const toBool = (value: unknown) => value === true || value === 1 || value === '1';
const getSessionExpiry = () => new Date(Date.now() + SESSION_TTL_MS).toISOString();
const serializeUser = (user: any) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  active: !!user.active,
  createdAt: user.createdAt || null
});
const safeJson = (value: unknown) => {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return '{}';
  }
};
const getClientIp = (req: any) => {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return String(forwarded[0]).trim();
  }
  return String(req.ip || req.socket?.remoteAddress || 'unknown').trim();
};
const getLoginAttemptKey = (email: string, ip: string) => `${email.toLowerCase()}|${ip}`;
const getTierLockMs = (failedCount: number) => {
  let lockMs = 0;
  for (const tier of LOGIN_LOCK_TIERS) {
    if (failedCount >= tier.threshold) {
      lockMs = tier.lockMs;
    }
  }
  return lockMs;
};
const resetLoginAttemptsIfStale = (attempt: any) => {
  if (!attempt?.firstFailedAt) return attempt;
  const firstFailedAt = new Date(attempt.firstFailedAt).getTime();
  if (Number.isNaN(firstFailedAt)) return attempt;
  if (Date.now() - firstFailedAt <= LOGIN_WINDOW_MS) return attempt;

  db.prepare(`
    UPDATE login_attempts
    SET failedCount = 0, firstFailedAt = NULL, lockedUntil = NULL, updatedAt = ?
    WHERE key = ?
  `).run(new Date().toISOString(), attempt.key);
  return {
    ...attempt,
    failedCount: 0,
    firstFailedAt: null,
    lockedUntil: null
  };
};
const getLoginAttempt = (key: string) => {
  const attempt: any = db.prepare('SELECT * FROM login_attempts WHERE key = ? LIMIT 1').get(key);
  return attempt ? resetLoginAttemptsIfStale(attempt) : null;
};
const clearLoginAttempt = (key: string) => {
  db.prepare('DELETE FROM login_attempts WHERE key = ?').run(key);
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Initialize Database
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    fantasyName TEXT,
    cnpj TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    renewalLinks TEXT
  );

  CREATE TABLE IF NOT EXISTS licenses (
    id TEXT PRIMARY KEY,
    companyId TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    expirationDate TEXT NOT NULL,
    currentLicenseFiles TEXT,
    renewalDocuments TEXT,
    notes TEXT,
    tags TEXT,
    FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    email TEXT,
    whatsapp TEXT,
    autoNotify INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    active INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    createdAt TEXT,
    expiresAt TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actorUserId TEXT,
    actorName TEXT,
    actorEmail TEXT,
    action TEXT NOT NULL,
    entityType TEXT NOT NULL,
    entityId TEXT,
    summary TEXT NOT NULL,
    details TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS login_attempts (
    key TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    ip TEXT NOT NULL,
    failedCount INTEGER NOT NULL DEFAULT 0,
    firstFailedAt TEXT,
    lockedUntil TEXT,
    lastAttemptAt TEXT,
    updatedAt TEXT NOT NULL
  );

  INSERT OR IGNORE INTO settings (id, email, whatsapp, autoNotify) VALUES (1, '', '', 0);
`);

// Add new columns to existing SQLite DB if missing
try { db.exec('ALTER TABLE licenses ADD COLUMN isRenewing INTEGER DEFAULT 0'); } catch (e) { }
try { db.exec('ALTER TABLE licenses ADD COLUMN renewalStartDate TEXT'); } catch (e) { }
try { db.exec('ALTER TABLE users ADD COLUMN createdAt TEXT'); } catch (e) { }
try { db.exec('ALTER TABLE sessions ADD COLUMN expiresAt TEXT'); } catch (e) { }
try { db.exec('ALTER TABLE audit_logs ADD COLUMN actorUserId TEXT'); } catch (e) { }
try { db.exec('ALTER TABLE audit_logs ADD COLUMN actorName TEXT'); } catch (e) { }
try { db.exec('ALTER TABLE audit_logs ADD COLUMN actorEmail TEXT'); } catch (e) { }
try { db.exec('ALTER TABLE audit_logs ADD COLUMN action TEXT'); } catch (e) { }
try { db.exec('ALTER TABLE audit_logs ADD COLUMN entityType TEXT'); } catch (e) { }
try { db.exec('ALTER TABLE audit_logs ADD COLUMN entityId TEXT'); } catch (e) { }
try { db.exec('ALTER TABLE audit_logs ADD COLUMN summary TEXT'); } catch (e) { }
try { db.exec('ALTER TABLE audit_logs ADD COLUMN details TEXT'); } catch (e) { }
try { db.exec('ALTER TABLE audit_logs ADD COLUMN createdAt TEXT'); } catch (e) { }
try { db.exec('ALTER TABLE login_attempts ADD COLUMN email TEXT'); } catch (e) { }
try { db.exec('ALTER TABLE login_attempts ADD COLUMN ip TEXT'); } catch (e) { }
try { db.exec('ALTER TABLE login_attempts ADD COLUMN failedCount INTEGER DEFAULT 0'); } catch (e) { }
try { db.exec('ALTER TABLE login_attempts ADD COLUMN firstFailedAt TEXT'); } catch (e) { }
try { db.exec('ALTER TABLE login_attempts ADD COLUMN lockedUntil TEXT'); } catch (e) { }
try { db.exec('ALTER TABLE login_attempts ADD COLUMN lastAttemptAt TEXT'); } catch (e) { }
try { db.exec('ALTER TABLE login_attempts ADD COLUMN updatedAt TEXT'); } catch (e) { }

// Migration logic from JSON to SQLite (one-time)
const migrateFromJSON = () => {
  const LICENSES_JSON = path.join(DATA_DIR, "licenses.json");
  const COMPANIES_JSON = path.join(DATA_DIR, "companies.json");
  const SETTINGS_JSON = path.join(DATA_DIR, "settings.json");

  if (fs.existsSync(COMPANIES_JSON)) {
    try {
      const companies = JSON.parse(fs.readFileSync(COMPANIES_JSON, "utf-8"));
      const insert = db.prepare('INSERT OR IGNORE INTO companies (id, name, fantasyName, cnpj, active, renewalLinks) VALUES (?, ?, ?, ?, ?, ?)');
      const transaction = db.transaction((data) => {
        for (const c of data) {
          insert.run(c.id, c.name, c.fantasyName, c.cnpj, c.active ? 1 : 0, JSON.stringify(c.renewalLinks || {}));
        }
      });
      transaction(companies);
      fs.renameSync(COMPANIES_JSON, COMPANIES_JSON + ".bak");
    } catch (e) { console.error("Migration error (companies):", e); }
  }

  if (fs.existsSync(LICENSES_JSON)) {
    try {
      const licenses = JSON.parse(fs.readFileSync(LICENSES_JSON, "utf-8"));
      const insert = db.prepare('INSERT OR IGNORE INTO licenses (id, companyId, name, type, expirationDate, currentLicenseFiles, renewalDocuments, notes, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
      const transaction = db.transaction((data) => {
        for (const l of data) {
          insert.run(
            l.id,
            l.companyId,
            l.name,
            l.type,
            l.expirationDate,
            JSON.stringify(l.currentLicenseFiles || []),
            JSON.stringify(l.renewalDocuments || []),
            l.notes || '',
            JSON.stringify(l.tags || [])
          );
        }
      });
      transaction(licenses);
      fs.renameSync(LICENSES_JSON, LICENSES_JSON + ".bak");
    } catch (e) { console.error("Migration error (licenses):", e); }
  }

  if (fs.existsSync(SETTINGS_JSON)) {
    try {
      const settings = JSON.parse(fs.readFileSync(SETTINGS_JSON, "utf-8"));
      db.prepare('UPDATE settings SET email = ?, whatsapp = ?, autoNotify = ? WHERE id = 1')
        .run(settings.email || '', settings.whatsapp || '', settings.autoNotify ? 1 : 0);
      fs.renameSync(SETTINGS_JSON, SETTINGS_JSON + ".bak");
    } catch (e) { console.error("Migration error (settings):", e); }
  }
};

migrateFromJSON();

const ensureAdminUser = () => {
  const existingAdmin: any = db.prepare("SELECT id FROM users WHERE lower(email) = lower(?)").get(ADMIN_EMAIL);
  if (existingAdmin) return;

  db.prepare(`
    INSERT INTO users (id, name, email, passwordHash, role, active, createdAt)
    VALUES (?, ?, ?, ?, 'admin', 1, ?)
  `).run(
    createId(),
    'Administrador',
    ADMIN_EMAIL.toLowerCase(),
    hashPassword(ADMIN_DEFAULT_PASSWORD),
    new Date().toISOString()
  );
};

ensureAdminUser();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.set('trust proxy', true);
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const getTokenFromRequest = (req: any) => {
    const authHeader = req.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice('Bearer '.length).trim();
    }
    return null;
  };

  const requireAuth = (req: any, res: any, next: any) => {
    const token = getTokenFromRequest(req);
    if (!token) return res.status(401).json({ error: 'Autenticação obrigatória.' });

    const authData: any = db.prepare(`
      SELECT u.*, s.expiresAt as sessionExpiresAt
      FROM sessions s
      JOIN users u ON u.id = s.userId
      WHERE s.token = ?
      LIMIT 1
    `).get(token);

    const expiresAt = authData?.sessionExpiresAt ? new Date(authData.sessionExpiresAt).getTime() : 0;
    const isExpired = !expiresAt || Number.isNaN(expiresAt) || expiresAt < Date.now();
    if (!authData || !authData.active || isExpired) {
      if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      return res.status(401).json({ error: 'Sessão inválida. Faça login novamente.' });
    }

    db.prepare('UPDATE sessions SET expiresAt = ? WHERE token = ?').run(getSessionExpiry(), token);
    req.authToken = token;
    req.authUser = authData;
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.authUser || req.authUser.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso permitido apenas para administradores.' });
    }
    next();
  };

  const recordAudit = (params: {
    actor?: any;
    action: string;
    entityType: string;
    entityId?: string | null;
    summary: string;
    details?: Record<string, unknown>;
  }) => {
    try {
      db.prepare(`
        INSERT INTO audit_logs (
          id, actorUserId, actorName, actorEmail, action, entityType, entityId, summary, details, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        createId(),
        params.actor?.id || null,
        params.actor?.name || null,
        params.actor?.email || null,
        params.action,
        params.entityType,
        params.entityId || null,
        params.summary,
        safeJson(params.details || {}),
        new Date().toISOString()
      );
    } catch (error) {
      console.error('[audit] Failed to record audit log:', error);
    }
  };

  // --- API Routes ---

  app.post("/api/auth/login", (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const clientIp = getClientIp(req);
    const attemptKey = getLoginAttemptKey(email, clientIp);
    const attempt = getLoginAttempt(attemptKey);

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    if (attempt?.lockedUntil) {
      const lockedUntilTs = new Date(attempt.lockedUntil).getTime();
      if (!Number.isNaN(lockedUntilTs) && lockedUntilTs > Date.now()) {
        const retryAfterSeconds = Math.max(1, Math.ceil((lockedUntilTs - Date.now()) / 1000));
        return res.status(423).json({
          error: 'Muitas tentativas. Tente novamente mais tarde.',
          retryAfterSeconds,
          lockedUntil: attempt.lockedUntil
        });
      }
    }

    const user: any = db.prepare("SELECT * FROM users WHERE lower(email) = lower(?) LIMIT 1").get(email);
    const passwordCheck = user ? verifyPassword(password, user.passwordHash) : { ok: false, needsRehash: false };
    if (!user || !passwordCheck.ok) {
      const now = new Date().toISOString();
      const nextFailedCount = (attempt?.failedCount || 0) + 1;
      const lockDuration = getTierLockMs(nextFailedCount);
      const lockUntil = lockDuration ? new Date(Date.now() + lockDuration).toISOString() : null;

      db.prepare(`
        INSERT INTO login_attempts (key, email, ip, failedCount, firstFailedAt, lockedUntil, lastAttemptAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          email = excluded.email,
          ip = excluded.ip,
          failedCount = excluded.failedCount,
          firstFailedAt = COALESCE(login_attempts.firstFailedAt, excluded.firstFailedAt),
          lockedUntil = excluded.lockedUntil,
          lastAttemptAt = excluded.lastAttemptAt,
          updatedAt = excluded.updatedAt
      `).run(
        attemptKey,
        email,
        clientIp,
        nextFailedCount,
        attempt?.firstFailedAt || now,
        lockUntil,
        now,
        now
      );

      if (lockUntil) {
        recordAudit({
          actor: user || null,
          action: 'auth.locked',
          entityType: 'session',
          entityId: attemptKey,
          summary: `Login locked for ${email}`,
          details: { email, ip: clientIp, failedCount: nextFailedCount, lockedUntil: lockUntil }
        });
        return res.status(423).json({
          error: 'Muitas tentativas. Sua conta foi bloqueada temporariamente.',
          retryAfterSeconds: Math.max(1, Math.ceil(lockDuration / 1000)),
          lockedUntil: lockUntil
        });
      }

      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    if (!user.active) {
      return res.status(403).json({ error: 'Usuário inativo. Contate o administrador.' });
    }

    if (passwordCheck.needsRehash) {
      db.prepare("UPDATE users SET passwordHash = ? WHERE id = ?").run(hashPassword(password), user.id);
    }

    clearLoginAttempt(attemptKey);

    const token = createId();
    db.prepare("INSERT INTO sessions (token, userId, createdAt, expiresAt) VALUES (?, ?, ?, ?)").run(
      token,
      user.id,
      new Date().toISOString(),
      getSessionExpiry()
    );
    recordAudit({
      actor: user,
      action: 'auth.login',
      entityType: 'session',
      entityId: token,
      summary: 'User signed in',
      details: { role: user.role, active: !!user.active }
    });

    res.json({
      token,
      user: serializeUser(user)
    });
  });

  app.get("/api/auth/me", requireAuth, (req: any, res) => {
    res.json({
      user: serializeUser(req.authUser)
    });
  });

  app.post("/api/auth/logout", requireAuth, (req: any, res) => {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(req.authToken);
    recordAudit({
      actor: req.authUser,
      action: 'auth.logout',
      entityType: 'session',
      entityId: req.authToken,
      summary: 'User signed out'
    });
    res.json({ success: true });
  });

  app.post("/api/auth/change-password", requireAuth, (req: any, res) => {
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'A nova senha deve ter ao menos 8 caracteres.' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'A nova senha deve ser diferente da atual.' });
    }

    const passwordCheck = verifyPassword(currentPassword, req.authUser.passwordHash);
    if (!passwordCheck.ok) {
      return res.status(401).json({ error: 'Senha atual incorreta.' });
    }

    db.prepare('UPDATE users SET passwordHash = ? WHERE id = ?').run(hashPassword(newPassword), req.authUser.id);
    db.prepare('DELETE FROM sessions WHERE userId = ? AND token != ?').run(req.authUser.id, req.authToken);
    recordAudit({
      actor: req.authUser,
      action: 'auth.change_password',
      entityType: 'user',
      entityId: req.authUser.id,
      summary: 'Password changed',
      details: { scope: 'self' }
    });

    res.json({ success: true });
  });

  app.get("/api/users", requireAuth, requireAdmin, (_req, res) => {
    const rows = db.prepare(`
      SELECT id, name, email, role, active, createdAt
      FROM users
      ORDER BY role DESC, name ASC
    `).all();
    res.json(rows.map((u: any) => ({ ...u, active: !!u.active })));
  });

  app.post("/api/users", requireAuth, requireAdmin, (req, res) => {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const role = req.body?.role === 'admin' ? 'admin' : 'user';
    const active = toBool(req.body?.active);

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'A senha deve ter ao menos 8 caracteres.' });
    }

    const emailExists = db.prepare("SELECT id FROM users WHERE lower(email) = lower(?) LIMIT 1").get(email);
    if (emailExists) {
      return res.status(409).json({ error: 'Já existe um usuário com esse e-mail.' });
    }

    const id = createId();
    const createdAt = new Date().toISOString();
    db.prepare(`
      INSERT INTO users (id, name, email, passwordHash, role, active, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, email, hashPassword(password), role, active ? 1 : 0, createdAt);

    const createdUser: any = db.prepare("SELECT id, name, email, role, active, createdAt FROM users WHERE id = ? LIMIT 1").get(id);
    if (!createdUser) return res.status(500).json({ error: 'Falha ao criar usuário.' });
    recordAudit({
      actor: req.authUser,
      action: 'users.create',
      entityType: 'user',
      entityId: id,
      summary: `Created user ${name}`,
      details: { email, role, active: !!active }
    });
    res.status(201).json({ ...createdUser, active: !!createdUser.active });
  });

  app.put("/api/users/:id", requireAuth, requireAdmin, (req: any, res) => {
    const targetId = String(req.params.id);
    const existing: any = db.prepare("SELECT * FROM users WHERE id = ? LIMIT 1").get(targetId);
    if (!existing) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const name = String(req.body?.name || existing.name).trim();
    const email = String(req.body?.email || existing.email).trim().toLowerCase();
    const role = req.body?.role === 'admin' ? 'admin' : 'user';
    const active = req.body?.active === undefined ? !!existing.active : toBool(req.body.active);
    const password = String(req.body?.password || '').trim();

    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
    }
    if (password && password.length < 8) {
      return res.status(400).json({ error: 'A nova senha deve ter ao menos 8 caracteres.' });
    }

    const emailOwner: any = db.prepare("SELECT id FROM users WHERE lower(email) = lower(?) LIMIT 1").get(email);
    if (emailOwner && emailOwner.id !== targetId) {
      return res.status(409).json({ error: 'Já existe um usuário com esse e-mail.' });
    }

    if (existing.role === 'admin' && (role !== 'admin' || !active)) {
      const otherAdmins: any = db.prepare(`
        SELECT COUNT(*) as count
        FROM users
        WHERE role = 'admin' AND active = 1 AND id != ?
      `).get(targetId);
      if (!otherAdmins || otherAdmins.count < 1) {
        return res.status(400).json({ error: 'Não é possível remover o último administrador ativo.' });
      }
    }

    if (password) {
      db.prepare(`
        UPDATE users
        SET name = ?, email = ?, role = ?, active = ?, passwordHash = ?
        WHERE id = ?
      `).run(name, email, role, active ? 1 : 0, hashPassword(password), targetId);
    } else {
      db.prepare(`
        UPDATE users
        SET name = ?, email = ?, role = ?, active = ?
        WHERE id = ?
      `).run(name, email, role, active ? 1 : 0, targetId);
    }

    const updatedUser: any = db.prepare("SELECT id, name, email, role, active, createdAt FROM users WHERE id = ? LIMIT 1").get(targetId);
    recordAudit({
      actor: req.authUser,
      action: 'users.update',
      entityType: 'user',
      entityId: targetId,
      summary: `Updated user ${name}`,
      details: { email, role, active: !!active, passwordChanged: !!password }
    });
    res.json({ ...updatedUser, active: !!updatedUser.active });
  });

  app.delete("/api/users/:id", requireAuth, requireAdmin, (req: any, res) => {
    const targetId = String(req.params.id);
    const existing: any = db.prepare("SELECT * FROM users WHERE id = ? LIMIT 1").get(targetId);
    if (!existing) return res.status(404).json({ error: 'Usuário não encontrado.' });

    if (existing.role === 'admin') {
      const otherAdmins: any = db.prepare(`
        SELECT COUNT(*) as count
        FROM users
        WHERE role = 'admin' AND active = 1 AND id != ?
      `).get(targetId);
      if (!otherAdmins || otherAdmins.count < 1) {
        return res.status(400).json({ error: 'Não é possível remover o último administrador ativo.' });
      }
    }

    db.prepare("DELETE FROM sessions WHERE userId = ?").run(targetId);
    db.prepare("DELETE FROM users WHERE id = ?").run(targetId);
    recordAudit({
      actor: req.authUser,
      action: 'users.delete',
      entityType: 'user',
      entityId: targetId,
      summary: `Deleted user ${existing.name}`,
      details: { email: existing.email, role: existing.role, active: !!existing.active }
    });
    res.json({ success: true });
  });

  app.get("/api/licenses", requireAuth, (_req, res) => {
    const rows = db.prepare('SELECT * FROM licenses').all();
    const licenses = rows.map((r: any) => {
      const l = {
        ...r,
        currentLicenseFiles: JSON.parse(r.currentLicenseFiles || '[]'),
        renewalDocuments: JSON.parse(r.renewalDocuments || '[]'),
        isRenewing: !!r.isRenewing,
        renewalStartDate: r.renewalStartDate || ''
      };
      delete l.tags; // Hide tags from frontend
      return l;
    });
    res.json(licenses);
  });

  app.post("/api/licenses", requireAuth, requireAdmin, (req, res) => {
    // Always generate a fresh ID to prevent PRIMARY KEY conflicts
    const id = createId();
    const { companyId, name, type, expirationDate, currentLicenseFiles, renewalDocuments, notes, isRenewing, renewalStartDate } = req.body;

    try {
      db.prepare(`
        INSERT INTO licenses (id, companyId, name, type, expirationDate, currentLicenseFiles, renewalDocuments, notes, isRenewing, renewalStartDate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        companyId,
        name,
        type,
        expirationDate,
        JSON.stringify(currentLicenseFiles || []),
        JSON.stringify(renewalDocuments || []),
        notes || '',
        isRenewing ? 1 : 0,
        renewalStartDate || ''
      );
      recordAudit({
        actor: req.authUser,
        action: 'licenses.create',
        entityType: 'license',
        entityId: id,
        summary: `Created license ${name}`,
        details: { companyId, type, expirationDate, isRenewing: !!isRenewing }
      });
      res.json({ ...req.body, id });
    } catch (err: any) {
      console.error('[POST /api/licenses] Error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/licenses/:id", requireAuth, (req, res) => {
    const fields = Object.keys(req.body).filter(f => f !== 'tags'); // Ensure tags are ignored if sent
    if (fields.length === 0) return res.json({ success: true });
    const existing: any = db.prepare("SELECT * FROM licenses WHERE id = ? LIMIT 1").get(req.params.id);

    const updates = fields.map(f => `${f} = ?`).join(', ');

    const values = fields.map(f => {
      if (['currentLicenseFiles', 'renewalDocuments'].includes(f)) {
        return JSON.stringify(req.body[f]);
      }
      if (f === 'isRenewing') {
        return req.body[f] ? 1 : 0;
      }
      return req.body[f];
    });

    try {
      db.prepare(`UPDATE licenses SET ${updates} WHERE id = ?`).run(...values, req.params.id);
      recordAudit({
        actor: req.authUser,
        action: 'licenses.update',
        entityType: 'license',
        entityId: req.params.id,
        summary: `Updated license ${existing?.name || req.params.id}`,
        details: {
          fields,
          companyId: req.body.companyId ?? existing?.companyId ?? null,
          name: req.body.name ?? existing?.name ?? null
        }
      });
      res.json({ success: true });
    } catch (err: any) {
      console.error('[PUT /api/licenses] Error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/licenses/:id", requireAuth, requireAdmin, (req, res) => {
    const existing: any = db.prepare("SELECT * FROM licenses WHERE id = ? LIMIT 1").get(req.params.id);
    db.prepare('DELETE FROM licenses WHERE id = ?').run(req.params.id);
    recordAudit({
      actor: req.authUser,
      action: 'licenses.delete',
      entityType: 'license',
      entityId: req.params.id,
      summary: `Deleted license ${existing?.name || req.params.id}`,
      details: { companyId: existing?.companyId || null, type: existing?.type || null }
    });
    res.json({ success: true });
  });

  app.get("/api/companies", requireAuth, (_req, res) => {
    const rows = db.prepare('SELECT * FROM companies').all();
    const companies = rows.map((r: any) => ({
      ...r,
      active: !!r.active,
      renewalLinks: JSON.parse(r.renewalLinks || '{}')
    }));
    res.json(companies);
  });

  app.post("/api/companies", requireAuth, requireAdmin, (req, res) => {
    // Always generate a fresh ID to prevent PRIMARY KEY conflicts
    const id = createId();
    const { name, fantasyName, cnpj, active, renewalLinks } = req.body;

    try {
      db.prepare(`
        INSERT INTO companies (id, name, fantasyName, cnpj, active, renewalLinks)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, name, fantasyName, cnpj, active ? 1 : 0, JSON.stringify(renewalLinks || {}));
      recordAudit({
        actor: req.authUser,
        action: 'companies.create',
        entityType: 'company',
        entityId: id,
        summary: `Created company ${fantasyName || name}`,
        details: { name, fantasyName, cnpj, active: !!active }
      });
      res.json({ ...req.body, id });
    } catch (err: any) {
      console.error('[POST /api/companies] Error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/companies/:id", requireAuth, requireAdmin, (req, res) => {
    const fields = Object.keys(req.body);
    if (fields.length === 0) return res.json({ success: true });
    const existing: any = db.prepare("SELECT * FROM companies WHERE id = ? LIMIT 1").get(req.params.id);

    const updates = fields.map(f => `${f} = ?`).join(', ');

    const values = fields.map(f => {
      if (f === 'renewalLinks') {
        return JSON.stringify(req.body[f]);
      }
      if (f === 'active') {
        return req.body[f] ? 1 : 0;
      }
      return req.body[f];
    });

    try {
      db.prepare(`UPDATE companies SET ${updates} WHERE id = ?`).run(...values, req.params.id);
      recordAudit({
        actor: req.authUser,
        action: 'companies.update',
        entityType: 'company',
        entityId: req.params.id,
        summary: `Updated company ${existing?.fantasyName || existing?.name || req.params.id}`,
        details: { fields, name: req.body.name ?? existing?.name ?? null, fantasyName: req.body.fantasyName ?? existing?.fantasyName ?? null }
      });
      res.json({ success: true });
    } catch (err: any) {
      console.error('[PUT /api/companies] Error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/companies/:id", requireAuth, requireAdmin, (req, res) => {
    const existing: any = db.prepare("SELECT * FROM companies WHERE id = ? LIMIT 1").get(req.params.id);
    db.prepare('DELETE FROM companies WHERE id = ?').run(req.params.id);
    recordAudit({
      actor: req.authUser,
      action: 'companies.delete',
      entityType: 'company',
      entityId: req.params.id,
      summary: `Deleted company ${existing?.fantasyName || existing?.name || req.params.id}`,
      details: { cnpj: existing?.cnpj || null, active: !!existing?.active }
    });
    res.json({ success: true });
  });

  app.get("/api/settings", requireAuth, (_req, res) => {
    const row: any = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    res.json({
      email: row.email,
      whatsapp: row.whatsapp,
      autoNotify: !!row.autoNotify
    });
  });

  app.post("/api/settings", requireAuth, requireAdmin, (req, res) => {
    const { email, whatsapp, autoNotify } = req.body;
    db.prepare('UPDATE settings SET email = ?, whatsapp = ?, autoNotify = ? WHERE id = 1')
      .run(email, whatsapp, autoNotify ? 1 : 0);
    recordAudit({
      actor: req.authUser,
      action: 'settings.update',
      entityType: 'settings',
      entityId: '1',
      summary: 'Updated system settings',
      details: { email, whatsappPresent: !!whatsapp, autoNotify: !!autoNotify }
    });
    res.json({ success: true });
  });

  app.get("/api/audit-logs", requireAuth, requireAdmin, (req: any, res) => {
    const limit = Math.max(1, Math.min(200, Number(req.query?.limit || 20) || 20));
    const entityType = String(req.query?.entityType || '').trim();

    const whereClause = entityType ? 'WHERE entityType = ?' : '';
    const params = entityType ? [entityType, limit] : [limit];

    const rows: any[] = db.prepare(`
      SELECT id, actorUserId, actorName, actorEmail, action, entityType, entityId, summary, details, createdAt
      FROM audit_logs
      ${whereClause}
      ORDER BY datetime(createdAt) DESC
      LIMIT ?
    `).all(...params);

    res.json(rows.map(row => ({
      ...row,
      details: row.details ? JSON.parse(row.details) : {}
    })));
  });

  // --- Automation Logic ---

  const checkAndNotify = async () => {
    const settings: any = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    if (!settings.autoNotify) return;

    const licenses = db.prepare('SELECT * FROM licenses').all() as any[];
    const today = new Date();

    for (const license of licenses) {
      const expDate = new Date(license.expirationDate);
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 30 || diffDays === 0) {
        console.log(`[AUTOMATION] Notifying for license: ${license.name}`);
        if (settings.email) {
          console.log(`[EMAIL] Sending to ${settings.email}: License ${license.name} expires in ${diffDays} days.`);
        }
        if (settings.whatsapp) {
          console.log(`[WHATSAPP] Sending to ${settings.whatsapp}: License ${license.name} expires in ${diffDays} days.`);
        }
      }
    }
  };

  setInterval(checkAndNotify, 1000 * 60 * 60 * 24);
  setTimeout(checkAndNotify, 5000);

  // --- Vite Middleware ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get(/.*/, (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
