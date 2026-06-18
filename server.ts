import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./src/supabaseConfig";
import { GoogleGenAI, Type } from "@google/genai";

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "cbt_server_db.json");

// Connect to external Supabase if keys exist in environment or config
let supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || SUPABASE_URL || "").trim();
if (supabaseUrl.startsWith('"') && supabaseUrl.endsWith('"')) {
  supabaseUrl = supabaseUrl.slice(1, -1).trim();
} else if (supabaseUrl.startsWith("'") && supabaseUrl.endsWith("'")) {
  supabaseUrl = supabaseUrl.slice(1, -1).trim();
}

// Clean up trailing slashes
while (supabaseUrl.endsWith("/")) {
  supabaseUrl = supabaseUrl.slice(0, -1).trim();
}

// Automatically detect and strip "/rest/v1" suffix commonly pasted by users from API documentation
if (supabaseUrl.endsWith("/rest/v1")) {
  supabaseUrl = supabaseUrl.substring(0, supabaseUrl.length - 8).trim();
}

// Strip any newly exposed trailing slashes
while (supabaseUrl.endsWith("/")) {
  supabaseUrl = supabaseUrl.slice(0, -1).trim();
}

let supabaseKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY || "").trim();
if (supabaseKey.startsWith('"') && supabaseKey.endsWith('"')) {
  supabaseKey = supabaseKey.slice(1, -1).trim();
} else if (supabaseKey.startsWith("'") && supabaseKey.endsWith("'")) {
  supabaseKey = supabaseKey.slice(1, -1).trim();
}

let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log("=== Supabase client created! Testing connection in handlers... ===");
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
  }
}

// Global state counter to notify devices/gadgets about state modifications instantly in real-time
let dbChangeCounter = Date.now();

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
        url: "Not set in server environment",
        error: "Supabase keys (SUPABASE_URL, SUPABASE_ANON_KEY) are not set in the environment yet."
      });
    }

    try {
      const startTime = Date.now();
      const { data, error } = await supabase.from("cbt_sync_store").select("key").limit(1);
      const readLatency = Date.now() - startTime;

      if (error) {
        if (error.code === "42P01" || error.code === "PGRST125" || error.message?.includes("does not exist") || error.message?.includes("PGRST125")) {
          return res.json({
            supabaseConfigured: true,
            supabaseConnected: true,
            tableExists: false,
            url: supabaseUrl,
            error: "The custom table 'cbt_sync_store' does not exist in your Supabase database yet (or the database schema is empty)."
          });
        }
        return res.json({
          supabaseConfigured: true,
          supabaseConnected: false,
          tableExists: false,
          url: supabaseUrl,
          error: error.message
        });
      }
      return res.json({
        supabaseConfigured: true,
        supabaseConnected: true,
        tableExists: true,
        url: supabaseUrl,
        readLatencyMs: readLatency,
        error: null
      });
    } catch (e: any) {
      res.json({
        supabaseConfigured: true,
        supabaseConnected: false,
        tableExists: false,
        url: supabaseUrl,
        error: e.message
      });
    }
  });

  // Fetch the current central database schema change/mutation version
  app.get("/api/db/version", (req, res) => {
    res.json({ version: dbChangeCounter });
  });

  // API Endpoints for Central Multi-Device Synchronization
  app.get("/api/db/get-all", async (req, res) => {
    const localDb = loadServerDb();
    
    if (!supabase) {
      // Return server-local DB state if Supabase is unconfigured
      return res.json({ ...localDb, usingSupabaseFallback: false, version: dbChangeCounter });
    }

    try {
      const { data, error } = await supabase.from("cbt_sync_store").select("*");
      if (error) {
        if (error.code === "PGRST125") {
          console.log("[Supabase Sync] Remote project has an uninitialized schema (Code 125). Serving local JSON DB backup store.");
          console.log("[Supabase Setup] Please use the SQL script under the Admin Dashboard tab to create the cbt_sync_store table when ready.");
        } else {
          console.log("[Supabase Sync] Remote request returned status code:", error.code, "-", error.message);
        }
        return res.json({ ...localDb, usingSupabaseFallback: true, syncError: error.message, version: dbChangeCounter });
      }

      const db: any = { initialized: false, usingSupabaseFallback: false };
      data.forEach((row: any) => {
        db[row.key] = row.data;
      });

      if (db.questions && db.questions.length > 0) {
        db.initialized = true;
      }

      // Maintain server-local DB mirrored state in file as secondary backup
      saveServerDb({ ...localDb, ...db });
      
      res.json({ ...db, version: dbChangeCounter });
    } catch (e: any) {
      console.error("Exception fetching from Supabase:", e);
      res.json({ ...localDb, usingSupabaseFallback: true, syncError: e.message, version: dbChangeCounter });
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
      dbChangeCounter++;
      res.json({ success: true, db: localDb, version: dbChangeCounter });
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
          dbChangeCounter++;
          console.warn(`Supabase upsert failed for key '${key}', saved to server fallback JSON instead:`, error.message);
          return res.json({ success: true, savedToLocalOnly: true, error: error.message, version: dbChangeCounter });
        }
      }

      dbChangeCounter++;
      console.log(`Updated central collection: "${key}" with state size ${Array.isArray(data) ? data.length : "object"}`);
      res.json({ success: true, savedToLocalOnly: !supabase, version: dbChangeCounter });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API Endpoint to review and auto-correct uploaded/custom questions using Gemini
  app.post("/api/db/ai-correct-questions", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        return res.status(400).json({ error: "Gemini API Key is not configured in Server environment variables. Please add GEMINI_API_KEY under the Settings > Secrets tab." });
      }

      // Initialize official @google/genai client
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      // 1. Fetch current questions
      let currentDb = loadServerDb();
      let questions: any[] = [];

      if (supabase) {
        const { data, error } = await supabase.from("cbt_sync_store").select("*").eq("key", "questions");
        if (!error && data && data.length > 0) {
          questions = data[0].data || [];
        } else {
          questions = currentDb.questions || [];
        }
      } else {
        questions = currentDb.questions || [];
      }

      if (!questions || questions.length === 0) {
        return res.status(400).json({ error: "The central question database appears empty. Please seed or upload subjects first!" });
      }

      // Filter questions that are custom uploaded or manual additions
      const uploadedQuestions = questions.filter(q => q.isUploaded === true);

      if (uploadedQuestions.length === 0) {
        return res.json({
          success: true,
          message: "No custom uploaded questions were found. All questions belong to the core database.",
          analyzedCount: 0,
          correctionsCount: 0,
          corrections: []
        });
      }

      console.log(`[AI Auto-Correct] Beginning audit on ${uploadedQuestions.length} custom-uploaded questions...`);

      // Batch size of 15 questions to ensure extreme precision and stay well within rate limits
      const BATCH_SIZE = 15;
      const correctionsMade: { id: string, oldAnswer: string, newAnswer: string, explanation: string, questionText: string }[] = [];
      const updatedQuestionsMap = new Map<string, any>();

      for (let i = 0; i < uploadedQuestions.length; i += BATCH_SIZE) {
        const batch = uploadedQuestions.slice(i, i + BATCH_SIZE);
        const formattedBatch = batch.map(q => ({
          id: q.id,
          questionText: q.questionText,
          options: q.options || [],
          currentAnswer: q.correctAnswer
        }));

        const prompt = `Review the following multiple-choice JSS3 Junior Secondary School exam questions.
Your task is to analyze each question's text and its list of options, and determine the single academically and factually correct answer option.
You MUST choose the correct answer exactly as it is written in the options array.

Questions to analyze:
${JSON.stringify(formattedBatch, null, 2)}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            systemInstruction: "You are an expert junior secondary curriculum board examiner and academic checker for JSS3 / BECE exams in Nigeria. Your job is to select the exact correct matching option from the options provided for each question, and explain correct reasoning.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                corrections: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      correctAnswer: { type: Type.STRING, description: "The exact matching text of the correct option. It MUST match one of the items in the options array exactly." },
                      explanation: { type: Type.STRING, description: "A brief academic explanation (1-2 sentences) of why this is the correct answer." }
                    },
                    required: ["id", "correctAnswer", "explanation"]
                  }
                }
              },
              required: ["corrections"]
            }
          }
        });

        const textOutput = response.text;
        if (!textOutput) {
          console.warn(`[AI Auto-Correct] Empty response from Gemini for batch starting at index ${i}`);
          continue;
        }

        try {
          const parsed = JSON.parse(textOutput.trim());
          const batchCorrections = parsed.corrections || [];

          for (const correction of batchCorrections) {
            const originalQuestion = batch.find(bq => bq.id === correction.id);
            if (!originalQuestion) continue;

            const originalOptions = originalQuestion.options || [];
            let chosenAnswer = (correction.correctAnswer || "").trim();

            if (originalOptions.length === 0) continue;

            // Highly resilient matching with options array
            let matchedOption = originalOptions.find((opt: string) => opt.trim().toLowerCase() === chosenAnswer.toLowerCase());
            
            // If direct match failed, try matching with index (e.g., if the model returned option index/prefix label "A.", "B.", "C.", etc.)
            if (!matchedOption) {
              const cleanedCorrection = chosenAnswer.toLowerCase().replace(/[.)\s]+/g, "");
              if (cleanedCorrection === "a" || cleanedCorrection === "optiona" || cleanedCorrection === "1") {
                matchedOption = originalOptions[0];
              } else if (cleanedCorrection === "b" || cleanedCorrection === "optionb" || cleanedCorrection === "2") {
                matchedOption = originalOptions[1];
              } else if (cleanedCorrection === "c" || cleanedCorrection === "optionc" || cleanedCorrection === "3") {
                matchedOption = originalOptions[2];
              } else if (cleanedCorrection === "d" || cleanedCorrection === "optiond" || cleanedCorrection === "4") {
                matchedOption = originalOptions[3];
              }
            }

            // Word-subset matching fallback
            if (!matchedOption) {
              matchedOption = originalOptions.find((opt: string) => 
                opt.toLowerCase().includes(chosenAnswer.toLowerCase()) || 
                chosenAnswer.toLowerCase().includes(opt.toLowerCase())
              );
            }

            // Fallback: Default to first option if empty or original current answer to safeguard
            if (!matchedOption) {
              matchedOption = originalQuestion.correctAnswer || originalOptions[0];
            }

            const cleanMatchedOption = matchedOption.trim();
            const cleanOriginalAnswer = (originalQuestion.correctAnswer || "").trim();

            const isDifferent = cleanMatchedOption.toLowerCase() !== cleanOriginalAnswer.toLowerCase();
            if (isDifferent) {
              correctionsMade.push({
                id: originalQuestion.id,
                oldAnswer: originalQuestion.correctAnswer,
                newAnswer: cleanMatchedOption,
                explanation: correction.explanation || originalQuestion.explanation,
                questionText: originalQuestion.questionText
              });
            }

            updatedQuestionsMap.set(originalQuestion.id, {
              ...originalQuestion,
              correctAnswer: cleanMatchedOption,
              explanation: correction.explanation || originalQuestion.explanation || "Verified JSS3 CBT correct answer."
            });
          }
        } catch (parseError) {
          console.error(`[AI Auto-Correct] JSON parsing failed for batch starting at index ${i}`, parseError, textOutput);
        }
      }

      // 2. Map final updated questions array
      const finalQuestionsList = questions.map(q => {
        if (updatedQuestionsMap.has(q.id)) {
          return updatedQuestionsMap.get(q.id);
        }
        return q;
      });

      // 3. Write updates back to local file
      currentDb.questions = finalQuestionsList;
      saveServerDb(currentDb);

      // 4. Mirror write to cloud Supabase if connected
      if (supabase) {
        const { error } = await supabase.from("cbt_sync_store").upsert({
          key: "questions",
          data: finalQuestionsList,
          updated_at: new Date().toISOString()
        });
        if (error) {
          console.error("[AI Auto-Correct] Failed pushing corrected array to Supabase:", error.message);
        }
      }

      dbChangeCounter++;
      console.log(`[AI Auto-Correct] Completed. Reviewed ${uploadedQuestions.length}, corrected ${correctionsMade.length} items.`);

      res.json({
        success: true,
        message: `Successfully analyzed ${uploadedQuestions.length} custom questions and corrected ${correctionsMade.length} wrong answers!`,
        analyzedCount: uploadedQuestions.length,
        correctionsCount: correctionsMade.length,
        corrections: correctionsMade,
        version: dbChangeCounter
      });

    } catch (e: any) {
      console.error("[AI Auto-Correct] Exception in API Handler:", e);
      res.status(500).json({ error: e.message || "An error occurred during verification." });
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
