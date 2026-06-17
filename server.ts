import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "cbt_server_db.json");

// Connect to external Supabase if keys exist in environment
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log("=== Supabase client created! Testing connection in handlers... ===");
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
  }
}

// Helper to load current local fallback database state safely
function loadServerDb() {
  if (!fs.existsSync(DB_FILE)) {
    return {
      initialized: false,
      questions: null,
      users: null,
      passwords: null,
      results: null,
      bookmarks: null,
      logs: null
    };
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading cbt_server_db.json, recreating...", e);
    return {
      initialized: false,
      questions: null,
      users: null,
      passwords: null,
      results: null,
      bookmarks: null,
      logs: null
    };
  }
}

// Helper to save local fallback database state safely
function saveServerDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Error writing to cbt_server_db.json", e);
    return false;
  }
}

async function startServer() {
  const app = express();

  // Allow high limits for importing JSS3 / BECE spreadsheets safely
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Get Supabase sync connection status
  app.get("/api/db/status", async (req, res) => {
    if (!supabase) {
      return res.json({
        supabaseConfigured: false,
        supabaseConnected: false,
        tableExists: false,
        error: "Supabase keys (SUPABASE_URL, SUPABASE_ANON_KEY) are not set in the environment yet."
      });
    }

    try {
      const { error } = await supabase.from("cbt_sync_store").select("key").limit(1);
      if (error) {
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          return res.json({
            supabaseConfigured: true,
            supabaseConnected: true,
            tableExists: false,
            error: "The custom table 'cbt_sync_store' does not exist in your Supabase database yet."
          });
        }
        return res.json({
          supabaseConfigured: true,
          supabaseConnected: false,
          tableExists: false,
          error: error.message
        });
      }
      return res.json({
        supabaseConfigured: true,
        supabaseConnected: true,
        tableExists: true,
        error: null
      });
    } catch (e: any) {
      res.json({
        supabaseConfigured: true,
        supabaseConnected: false,
        tableExists: false,
        error: e.message
      });
    }
  });

  // API Endpoints for Central Multi-Device Synchronization
  app.get("/api/db/get-all", async (req, res) => {
    const localDb = loadServerDb();
    
    if (!supabase) {
      // Return server-local DB state if Supabase is unconfigured
      return res.json({ ...localDb, usingSupabaseFallback: false });
    }

    try {
      const { data, error } = await supabase.from("cbt_sync_store").select("*");
      if (error) {
        console.warn("Supabase fetch failed, falling back to local Server DB. Error Code:", error.code);
        return res.json({ ...localDb, usingSupabaseFallback: true, syncError: error.message });
      }

      const db: any = { initialized: true, usingSupabaseFallback: false };
      data.forEach((row: any) => {
        db[row.key] = row.data;
      });

      // Maintain server-local DB mirrored state in file as secondary backup
      saveServerDb({ ...localDb, ...db });
      
      res.json(db);
    } catch (e: any) {
      console.error("Exception fetching from Supabase:", e);
      res.json({ ...localDb, usingSupabaseFallback: true, syncError: e.message });
    }
  });

  app.post("/api/db/initialize", async (req, res) => {
    try {
      const payload = req.body;
      const collections = {
        questions: payload.questions || [],
        users: payload.users || [],
        passwords: payload.passwords || {},
        results: payload.results || [],
        bookmarks: payload.bookmarks || [],
        logs: payload.logs || []
      };

      // 1. Double write/update to server-local fallback database
      const localDb = {
        initialized: true,
        ...collections
      };
      saveServerDb(localDb);

      // 2. Write to Supabase if connected
      if (supabase) {
        console.log("Initializing Cloud Supabase dynamic cbt_sync_store contents...");
        for (const [key, val] of Object.entries(collections)) {
          await supabase.from("cbt_sync_store").upsert({
            key,
            data: val,
            updated_at: new Date().toISOString()
          });
        }
      }

      console.log("Central server database successfully initialized from local configuration!");
      res.json({ success: true, db: localDb });
    } catch (e: any) {
      console.error("Fail initialize API handler:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/db/update", async (req, res) => {
    try {
      const { key, data } = req.body;
      if (!key) {
        return res.status(400).json({ error: "Missing collection key name" });
      }

      // 1. Mirror locally in server file system
      const localDb = loadServerDb();
      localDb.initialized = true;
      localDb[key] = data;
      saveServerDb(localDb);

      // 2. Write to Supabase database if configured
      if (supabase) {
        const { error } = await supabase.from("cbt_sync_store").upsert({
          key,
          data,
          updated_at: new Date().toISOString()
        });
        if (error) {
          console.warn(`Supabase upsert failed for key '${key}', saved to server fallback JSON instead:`, error.message);
          return res.json({ success: true, savedToLocalOnly: true, error: error.message });
        }
      }

      console.log(`Updated central collection: "${key}" with state size ${Array.isArray(data) ? data.length : "object"}`);
      res.json({ success: true, savedToLocalOnly: !supabase });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Vite development vs production asset handling middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`=== Centralized Full-Stack JSS3 CBT Server booted on port ${PORT} ===`);
  });
}

startServer();
