import { getQuestionsFromDB, initializeDB } from "../data/questionDatabase";
import { getUsersFromDB } from "./auth";
import { getResultsFromDB } from "./results";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../supabaseConfig";

// Safe Singleton direct browser Supabase connection
let clientSupabaseInstance: any = null;

export function getClientSupabase() {
  if (clientSupabaseInstance) return clientSupabaseInstance;

  let supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL || "").trim();
  let supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY || "").trim();

  // Strip possible outer quotes
  if (supabaseUrl.startsWith('"') && supabaseUrl.endsWith('"')) supabaseUrl = supabaseUrl.slice(1, -1).trim();
  if (supabaseUrl.startsWith("'") && supabaseUrl.endsWith("'")) supabaseUrl = supabaseUrl.slice(1, -1).trim();
  while (supabaseUrl.endsWith("/")) supabaseUrl = supabaseUrl.slice(0, -1).trim();
  if (supabaseUrl.endsWith("/rest/v1")) supabaseUrl = supabaseUrl.substring(0, supabaseUrl.length - 8).trim();
  while (supabaseUrl.endsWith("/")) supabaseUrl = supabaseUrl.slice(0, -1).trim();

  if (supabaseKey.startsWith('"') && supabaseKey.endsWith('"')) supabaseKey = supabaseKey.slice(1, -1).trim();
  if (supabaseKey.startsWith("'") && supabaseKey.endsWith("'")) supabaseKey = supabaseKey.slice(1, -1).trim();

  if (supabaseUrl && supabaseKey) {
    try {
      clientSupabaseInstance = createClient(supabaseUrl, supabaseKey);
      console.log("[Client Sync Engine] Direct Browser-to-Supabase fallback link activated successfully.");
      return clientSupabaseInstance;
    } catch (e) {
      console.error("[Client Sync Engine] Failed to initialize direct browser Supabase link:", e);
    }
  }
  return null;
}

// Fallback direct browser-to-Supabase sync if backend is uncontactable (static deployment like Vercel/Netlify)
export async function syncDirectWithClientSupabase(): Promise<boolean> {
  const client = getClientSupabase();
  if (!client) {
    console.log("[Client Sync] Ephemeral standalone state. Sticking to offline local storage.");
    return false;
  }

  try {
    const { data, error } = await client.from("cbt_sync_store").select("*");
    if (error) {
      console.warn("[Client Sync] Direct browser Supabase request returned read error:", error.message);
      return false;
    }

    if (data && data.length > 0) {
      const db: any = {};
      const syncedTimestamps: Record<string, string> = {};
      data.forEach((row: any) => {
        db[row.key] = row.data;
        syncedTimestamps[row.key] = row.updated_at || new Date().toISOString();
      });

      if (db.questions) localStorage.setItem("FF_CBT_QUESTIONS", JSON.stringify(db.questions));
      if (db.users) localStorage.setItem("FF_CBT_USERS", JSON.stringify(db.users));
      if (db.passwords) localStorage.setItem("FF_CBT_PASSWORDS", JSON.stringify(db.passwords));
      if (db.results) localStorage.setItem("FF_CBT_RESULTS", JSON.stringify(db.results));
      if (db.bookmarks) localStorage.setItem("FF_CBT_BOOKMARKS", JSON.stringify(db.bookmarks));
      if (db.logs) localStorage.setItem("FF_CBT_ACTIVITY_LOGS", JSON.stringify(db.logs));
      
      localStorage.setItem("FF_CBT_DB_INITIALIZED", "true");
      localStorage.setItem("FF_CBT_DB_V5_STABLE", "true");
      localStorage.setItem("FF_CBT_DB_SYNCED_TIMESTAMPS", JSON.stringify(syncedTimestamps));

      const currentVersion = parseInt(localStorage.getItem("FF_CBT_DB_VERSION") || "0", 10);
      localStorage.setItem("FF_CBT_DB_VERSION", String(currentVersion + 1));

      window.dispatchEvent(new Event("cbt-db-synced"));
      console.log("=== [Client Sync] Hydrated browser memory directly with cloud Supabase! ===");
      return true;
    } else {
      console.log("[Client Sync] Cloud Supabase cbt_sync_store is empty. Seed-populating with local defaults...");
      const defaultQuestions = getQuestionsFromDB();
      const defaultUsers = getUsersFromDB();
      const defaultPasswords = JSON.parse(localStorage.getItem("FF_CBT_PASSWORDS") || "{}");
      const defaultResults = getResultsFromDB();
      const defaultBookmarks = JSON.parse(localStorage.getItem("FF_CBT_BOOKMARKS") || "[]");
      const defaultLogs = JSON.parse(localStorage.getItem("FF_CBT_ACTIVITY_LOGS") || "[]");

      const collections = {
        questions: defaultQuestions,
        users: defaultUsers,
        passwords: defaultPasswords,
        results: defaultResults,
        bookmarks: defaultBookmarks,
        logs: defaultLogs
      };

      const seededTimestamps: Record<string, string> = {};
      const nowStr = new Date().toISOString();

      for (const [key, val] of Object.entries(collections)) {
        await client.from("cbt_sync_store").upsert({
          key,
          data: val,
          updated_at: nowStr
        });
        seededTimestamps[key] = nowStr;
      }

      localStorage.setItem("FF_CBT_DB_INITIALIZED", "true");
      localStorage.setItem("FF_CBT_DB_V5_STABLE", "true");
      localStorage.setItem("FF_CBT_DB_SYNCED_TIMESTAMPS", JSON.stringify(seededTimestamps));
      
      const currentVersion = parseInt(localStorage.getItem("FF_CBT_DB_VERSION") || "0", 10);
      localStorage.setItem("FF_CBT_DB_VERSION", String(currentVersion + 1));

      window.dispatchEvent(new Event("cbt-db-synced"));
      console.log("=== [Client Sync] Seeding of cloud Supabase complete! ===");
      return true;
    }
  } catch (err) {
    console.error("[Client Sync] Direct browser Supabase initialization sync error:", err);
    return false;
  }
}

// Synchronize local browser localStorage with central express server
export async function syncWithServer(): Promise<boolean> {
  try {
    const response = await fetch("/api/db/get-all");
    if (!response.ok) {
      throw new Error("Local backend node is offline or unreachable");
    }
    const serverDb = await response.json();

    if (serverDb && serverDb.initialized) {
      // Save central version to prevent redundant polling downloads
      if (serverDb.version !== undefined) {
        localStorage.setItem("FF_CBT_DB_VERSION", String(serverDb.version));
      }

      // 1. Server database is already populated. Hydrate browser localStorage!
      if (serverDb.questions) {
        localStorage.setItem("FF_CBT_QUESTIONS", JSON.stringify(serverDb.questions));
        localStorage.setItem("FF_CBT_DB_INITIALIZED", "true");
        localStorage.setItem("FF_CBT_DB_V5_STABLE", "true");
      }
      if (serverDb.users) {
        localStorage.setItem("FF_CBT_USERS", JSON.stringify(serverDb.users));
      }
      if (serverDb.passwords) {
        localStorage.setItem("FF_CBT_PASSWORDS", JSON.stringify(serverDb.passwords));
      }
      if (serverDb.results) {
        localStorage.setItem("FF_CBT_RESULTS", JSON.stringify(serverDb.results));
      }
      if (serverDb.bookmarks) {
        localStorage.setItem("FF_CBT_BOOKMARKS", JSON.stringify(serverDb.bookmarks));
      }
      if (serverDb.logs) {
        localStorage.setItem("FF_CBT_ACTIVITY_LOGS", JSON.stringify(serverDb.logs));
      }

      // Notify any active React states to update themselves from storage
      window.dispatchEvent(new Event("cbt-db-synced"));
      console.log("=== Automatically hydrated localStorage from Express Server ===");
      return true;
    } else {
      // 2. Server database is uninitialized (fresh deployment). 
      // Initialize local defaults first
      const defaultQuestions = getQuestionsFromDB();
      const defaultUsers = getUsersFromDB();
      const defaultResults = getResultsFromDB();
      const defaultBookmarks = JSON.parse(localStorage.getItem("FF_CBT_BOOKMARKS") || "[]");
      const defaultLogs = JSON.parse(localStorage.getItem("FF_CBT_ACTIVITY_LOGS") || "[]");
      const defaultPasswords = JSON.parse(localStorage.getItem("FF_CBT_PASSWORDS") || "{}");

      // Push initial values to server so they persist for all future devices & clients!
      const initResponse = await fetch("/api/db/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: defaultQuestions,
          users: defaultUsers,
          passwords: defaultPasswords,
          results: defaultResults,
          bookmarks: defaultBookmarks,
          logs: defaultLogs
        })
      });

      if (!initResponse.ok) {
        throw new Error("Failed to initialize server database with defaults");
      }

      const initResult = await initResponse.json();
      if (initResult && initResult.version !== undefined) {
        localStorage.setItem("FF_CBT_DB_VERSION", String(initResult.version));
      }
      
      window.dispatchEvent(new Event("cbt-db-synced"));
      console.log("=== Successfully initialized Central Server with seed content ===");
      return true;
    }
  } catch (error) {
    console.log("Failed to contact Express Server api. Entering direct client-side Supabase link...");
    // Fallback directly to client-side Supabase!
    return await syncDirectWithClientSupabase();
  }
}

// Background utility to safely upload a updated collection to the central server
export async function pushCollectionToServer(key: string, data: any): Promise<boolean> {
  try {
    const response = await fetch("/api/db/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, data })
    });
    if (!response.ok) {
      throw new Error(`Sync error while saving collection "${key}"`);
    }
    const result = await response.json();
    if (result.success && result.version !== undefined) {
      localStorage.setItem("FF_CBT_DB_VERSION", String(result.version));
    }
    // Fire event to notify local state components that data has updated
    window.dispatchEvent(new Event("cbt-db-synced"));
    return result.success;
  } catch (e) {
    console.log(`Failed to push collection "${key}" to Express backend. Retrying direct browser Supabase link...`);
    
    // Check direct browser link!
    const client = getClientSupabase();
    if (client) {
      try {
        const nowStr = new Date().toISOString();
        const { error } = await client.from("cbt_sync_store").upsert({
          key,
          data,
          updated_at: nowStr
        });
        if (!error) {
          // Update local synced timestamps registry so we don't treat our own save as out-of-date
          const savedTimestampsStr = localStorage.getItem("FF_CBT_DB_SYNCED_TIMESTAMPS") || "{}";
          let localTimestamps: Record<string, string> = {};
          try {
            localTimestamps = JSON.parse(savedTimestampsStr);
          } catch (tErr) {}
          localTimestamps[key] = nowStr;
          localStorage.setItem("FF_CBT_DB_SYNCED_TIMESTAMPS", JSON.stringify(localTimestamps));

          const currentVersion = parseInt(localStorage.getItem("FF_CBT_DB_VERSION") || "0", 10);
          localStorage.setItem("FF_CBT_DB_VERSION", String(currentVersion + 1));
          window.dispatchEvent(new Event("cbt-db-synced"));
          console.log(`=== [Client Sync] Directly saved "${key}" to Cloud Supabase successfully! ===`);
          return true;
        } else {
          console.warn("[Client Sync] Browser direct write error:", error.message);
        }
      } catch (err) {
        console.error("[Client Sync] Failed direct browser write:", err);
      }
    }
    
    console.warn("Offline fallback state preserved.", e);
    return false;
  }
}

