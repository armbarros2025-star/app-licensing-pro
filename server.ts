
import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "database.db");

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

  INSERT OR IGNORE INTO settings (id, email, whatsapp, autoNotify) VALUES (1, '', '', 0);
`);

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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- API Routes ---

  app.get("/api/licenses", (req, res) => {
    const rows = db.prepare('SELECT * FROM licenses').all();
    const licenses = rows.map((r: any) => ({
      ...r,
      currentLicenseFiles: JSON.parse(r.currentLicenseFiles || '[]'),
      renewalDocuments: JSON.parse(r.renewalDocuments || '[]'),
      tags: JSON.parse(r.tags || '[]')
    }));
    res.json(licenses);
  });

  app.post("/api/licenses", (req, res) => {
    const id = req.body.id || Math.random().toString(36).substr(2, 9);
    const { companyId, name, type, expirationDate, currentLicenseFiles, renewalDocuments, notes, tags } = req.body;

    db.prepare(`
      INSERT INTO licenses (id, companyId, name, type, expirationDate, currentLicenseFiles, renewalDocuments, notes, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      companyId,
      name,
      type,
      expirationDate,
      JSON.stringify(currentLicenseFiles || []),
      JSON.stringify(renewalDocuments || []),
      notes || '',
      JSON.stringify(tags || [])
    );

    res.json({ ...req.body, id });
  });

  app.put("/api/licenses/:id", (req, res) => {
    const fields = Object.keys(req.body);
    if (fields.length === 0) return res.json({ success: true });

    const updates = fields.map(f => {
      if (['currentLicenseFiles', 'renewalDocuments', 'tags'].includes(f)) {
        return `${f} = '${JSON.stringify(req.body[f])}'`;
      }
      return `${f} = ?`;
    }).join(', ');

    const values = fields
      .filter(f => !['currentLicenseFiles', 'renewalDocuments', 'tags'].includes(f))
      .map(f => req.body[f]);

    db.prepare(`UPDATE licenses SET ${updates} WHERE id = ?`).run(...values, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/licenses/:id", (req, res) => {
    db.prepare('DELETE FROM licenses WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/companies", (req, res) => {
    const rows = db.prepare('SELECT * FROM companies').all();
    const companies = rows.map((r: any) => ({
      ...r,
      active: !!r.active,
      renewalLinks: JSON.parse(r.renewalLinks || '{}')
    }));
    res.json(companies);
  });

  app.post("/api/companies", (req, res) => {
    const id = req.body.id || Math.random().toString(36).substr(2, 9);
    const { name, fantasyName, cnpj, active, renewalLinks } = req.body;

    db.prepare(`
      INSERT INTO companies (id, name, fantasyName, cnpj, active, renewalLinks)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, fantasyName, cnpj, active ? 1 : 0, JSON.stringify(renewalLinks || {}));

    res.json({ ...req.body, id });
  });

  app.put("/api/companies/:id", (req, res) => {
    const fields = Object.keys(req.body);
    if (fields.length === 0) return res.json({ success: true });

    const updates = fields.map(f => {
      if (f === 'renewalLinks') {
        return `${f} = '${JSON.stringify(req.body[f])}'`;
      }
      if (f === 'active') {
        return `${f} = ${req.body[f] ? 1 : 0}`;
      }
      return `${f} = ?`;
    }).join(', ');

    const values = fields
      .filter(f => !['renewalLinks', 'active'].includes(f))
      .map(f => req.body[f]);

    db.prepare(`UPDATE companies SET ${updates} WHERE id = ?`).run(...values, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/companies/:id", (req, res) => {
    db.prepare('DELETE FROM companies WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/settings", (req, res) => {
    const row: any = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    res.json({
      email: row.email,
      whatsapp: row.whatsapp,
      autoNotify: !!row.autoNotify
    });
  });

  app.post("/api/settings", (req, res) => {
    const { email, whatsapp, autoNotify } = req.body;
    db.prepare('UPDATE settings SET email = ?, whatsapp = ?, autoNotify = ? WHERE id = 1')
      .run(email, whatsapp, autoNotify ? 1 : 0);
    res.json({ success: true });
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
