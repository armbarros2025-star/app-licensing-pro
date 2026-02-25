
import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");
const LICENSES_FILE = path.join(DATA_DIR, "licenses.json");
const COMPANIES_FILE = path.join(DATA_DIR, "companies.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Helper to read/write JSON files
const readJSON = (file: string, defaultData: any = []) => {
  if (!fs.existsSync(file)) return defaultData;
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch (e) {
    return defaultData;
  }
};

const writeJSON = (file: string, data: any) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- API Routes ---

  app.get("/api/licenses", (req, res) => {
    res.json(readJSON(LICENSES_FILE));
  });

  app.post("/api/licenses", (req, res) => {
    const licenses = readJSON(LICENSES_FILE);
    const newLicense = { ...req.body, id: req.body.id || Math.random().toString(36).substr(2, 9) };
    licenses.push(newLicense);
    writeJSON(LICENSES_FILE, licenses);
    res.json(newLicense);
  });

  app.put("/api/licenses/:id", (req, res) => {
    let licenses = readJSON(LICENSES_FILE);
    licenses = licenses.map((l: any) => l.id === req.params.id ? { ...l, ...req.body } : l);
    writeJSON(LICENSES_FILE, licenses);
    res.json({ success: true });
  });

  app.delete("/api/licenses/:id", (req, res) => {
    let licenses = readJSON(LICENSES_FILE);
    licenses = licenses.filter((l: any) => l.id !== req.params.id);
    writeJSON(LICENSES_FILE, licenses);
    res.json({ success: true });
  });

  app.get("/api/companies", (req, res) => {
    res.json(readJSON(COMPANIES_FILE, []));
  });

  app.post("/api/companies", (req, res) => {
    const companies = readJSON(COMPANIES_FILE);
    const newCompany = { ...req.body, id: req.body.id || Math.random().toString(36).substr(2, 9) };
    companies.push(newCompany);
    writeJSON(COMPANIES_FILE, companies);
    res.json(newCompany);
  });

  app.get("/api/settings", (req, res) => {
    res.json(readJSON(SETTINGS_FILE, { email: "", whatsapp: "", autoNotify: false }));
  });

  app.post("/api/settings", (req, res) => {
    writeJSON(SETTINGS_FILE, req.body);
    res.json({ success: true });
  });

  // --- Automation Logic ---

  const checkAndNotify = async () => {
    const settings = readJSON(SETTINGS_FILE, { email: "", whatsapp: "", autoNotify: false });
    if (!settings.autoNotify) return;

    const licenses = readJSON(LICENSES_FILE);
    const today = new Date();
    
    for (const license of licenses) {
      const expDate = new Date(license.expirationDate);
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Notify if exactly 30 days remaining (or if expired today)
      if (diffDays === 30 || diffDays === 0) {
        console.log(`[AUTOMATION] Notifying for license: ${license.name}`);
        
        // Email Simulation/Implementation
        if (settings.email) {
          try {
            // In a real app, use nodemailer with real transport
            console.log(`[EMAIL] Sending to ${settings.email}: License ${license.name} expires in ${diffDays} days.`);
          } catch (e) {
            console.error("[EMAIL ERROR]", e);
          }
        }

        // WhatsApp Simulation
        if (settings.whatsapp) {
          console.log(`[WHATSAPP] Sending to ${settings.whatsapp}: License ${license.name} expires in ${diffDays} days.`);
        }
      }
    }
  };

  // Run automation check every 24 hours (simulated here)
  setInterval(checkAndNotify, 1000 * 60 * 60 * 24);
  // Run once on startup
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
