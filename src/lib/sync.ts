import { getQuestionsFromDB, initializeDB } from "../data/questionDatabase";
import { getUsersFromDB } from "./auth";
import { getResultsFromDB } from "./results";

// Synchronize local browser localStorage with central express server
export async function syncWithServer(): Promise<boolean> {
  try {
    const response = await fetch("/api/db/get-all");
    if (!response.ok) {
      throw new Error("Failed to contact central JSS3 CBT Server");
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
      console.log("=== Successfully hydrated localStorage with Central Server State ===");
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
    console.error("Failed to perform real-time cloud synchronization:", error);
    return false;
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
    console.warn("Retrying collection push in background later. Offline state preserved.", e);
    return false;
  }
}
