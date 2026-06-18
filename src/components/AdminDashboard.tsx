import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from "xlsx";
import { User, Subject, Question, UserRole } from "../types";
import { SUBJECTS } from "../data/subjectData";
import {
  getQuestionsFromDB,
  saveQuestionsToDB,
  addQuestionToDB,
  deleteQuestionFromDB,
  getActivityLogs,
  logActivity
} from "../data/questionDatabase";
import { getResultsFromDB, saveResultsToDB } from "../lib/results";
import DatabaseHealthCheck from "./DatabaseHealthCheck";
import { pushCollectionToServer, syncWithServer } from "../lib/sync";
import LucideIcon from "./LucideIcon";
import schoolLogo from "../assets/images/school_logo_1781627574517.jpg";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from "recharts";

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export default function AdminDashboard({
  user,
  onLogout,
  darkMode,
  setDarkMode
}: AdminDashboardProps) {
  const [activeSegment, setActiveSegment] = useState<"stats" | "bank" | "results" | "logs" | "diagnostics" | "users">("stats");
  const [questions, setQuestions] = useState<Question[]>(getQuestionsFromDB());
  const [results, setResults] = useState<any[]>(getResultsFromDB());
  const [users, setUsers] = useState<User[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("FF_CBT_USERS") || "[]");
    } catch {
      return [];
    }
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [activityLogs, setActivityLogs] = useState<any[]>(getActivityLogs());

  // Accounts / Users management states
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userFilterRole, setUserFilterRole] = useState<string>("all");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: UserRole.STUDENT
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormError, setUserFormError] = useState("");

  // Result view filter states
  const [resultSearchQuery, setResultSearchQuery] = useState("");
  const [resultFilterSubject, setResultFilterSubject] = useState("");
  const [resultFilterMode, setResultFilterMode] = useState<string>("all");
  const [selectedResultDetail, setSelectedResultDetail] = useState<any | null>(null);

  // Edit / Add MODALS
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // AI Answer Assistant & Auto-Correction states
  const [aiHealingStatus, setAiHealingStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [aiHealingResults, setAiHealingResults] = useState<{
    message: string;
    analyzedCount: number;
    correctionsCount: number;
    corrections: Array<{ id: string; questionText: string; oldAnswer: string; newAnswer: string; explanation: string }>;
    totalUploaded?: number;
    totalRemaining?: number;
  } | null>(null);
  const [aiHealingError, setAiHealingError] = useState<string | null>(null);

  const handleAiCorrectQuestions = async () => {
    if (confirm("This will analyze all custom-uploaded JSS3 questions with Google Gemini and automatically correct incorrect answer choices. This takes about 10-30s. Continue?")) {
      setAiHealingStatus("running");
      setAiHealingError(null);
      setAiHealingResults(null);
      try {
        const response = await fetch("/api/db/ai-correct-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
        });
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${response.status}: Failed to reach correction server.`);
        }
        
        const data = await response.json();
        setAiHealingResults(data);
        setAiHealingStatus("success");
        
        // Log to activity feeds
        logActivity(
          "system",
          "System Database Manager",
          UserRole.ADMIN,
          "AI Question Healing Completed",
          `Analyzed ${data.analyzedCount} uploads, corrected ${data.correctionsCount} answers using Gemini.`
        );

        // Download and reload database states
        await syncWithServer();
      } catch (err: any) {
        console.error("AI Healing error:", err);
        setAiHealingError(err.message || "An unexpected error occurred during correction.");
        setAiHealingStatus("error");
      }
    }
  };
  const [newQForm, setNewQForm] = useState({
    subjectId: "maths",
    questionText: "",
    optA: "",
    optB: "",
    optC: "",
    optD: "",
    correctAnswer: "",
    explanation: "",
    difficulty: "Medium" as "Easy" | "Medium" | "Hard",
    topic: ""
  });

  // Bulk Import
  const [csvText, setCsvText] = useState("");
  const [bulkError, setBulkError] = useState("");
  const [bulkSuccess, setBulkSuccess] = useState("");

  // File Upload states for Excel/CSV parsing and preview picking
  const [uploadedQuestions, setUploadedQuestions] = useState<Question[]>([]);
  const [selectedUploadIds, setSelectedUploadIds] = useState<Record<string, boolean>>({});
  const [fileImportSuccess, setFileImportSuccess] = useState("");
  const [fileImportError, setFileImportError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [activeImportTab, setActiveImportTab] = useState<"file" | "paste">("file");
  const [importSubjectOverride, setImportSubjectOverride] = useState<string>("auto");

  // Supabase synchronization status state
  const [supabaseStatus, setSupabaseStatus] = useState<{
    supabaseConfigured: boolean;
    supabaseConnected: boolean;
    tableExists: boolean;
    error: string | null;
  } | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [isCloudSaving, setIsCloudSaving] = useState(false);
  const [cloudSaveMessage, setCloudSaveMessage] = useState("");
  const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null);

  const handleDeleteUploadedBySubject = async (subId: string) => {
    if (!confirm(`Are you sure you want to remove ALL custom uploaded questions for subject: "${subId}"? This will preserve the core syllabus questions completely.`)) {
      return;
    }
    
    setIsCloudSaving(true);
    setCloudSaveMessage(`Removing custom questions for ${subId}...`);
    
    try {
      const currentDB = getQuestionsFromDB();
      const filtered = currentDB.filter(q => !(q.subjectId === subId && q.isUploaded));
      
      const syncOk = await saveQuestionsToDB(filtered);
      setQuestions(filtered);
      
      logActivity(
        user.id,
        user.fullName,
        UserRole.ADMIN,
        "Delete custom subject questions",
        `Deleted all custom uploaded questions for subject ID: ${subId}.`
      );
      
      setFileImportSuccess(`Successfully deleted all custom uploaded questions for "${subId}".`);
      setTimeout(() => setFileImportSuccess(""), 5000);
    } catch (err: any) {
      alert(`Failed to delete questions: ${err.message || err}`);
    } finally {
      setIsCloudSaving(false);
      setCloudSaveMessage("");
      setDeletingSubjectId(null);
    }
  };

  useEffect(() => {
    async function checkSupabase() {
      try {
        const res = await fetch("/api/db/status");
        if (res.ok) {
          const data = await res.json();
          setSupabaseStatus(data);
        }
      } catch (e) {
        console.error("Failed to fetch Supabase integration status", e);
      }
    }
    checkSupabase();
  }, [questions, results]);

  // Periodic background check to download database updates from Supabase Cloud if changed by other devices
  useEffect(() => {
    function handleCbtDbSynced() {
      console.log("[AdminDashboard] Centralized update notification received. Refreshing admin states.");
      setQuestions(getQuestionsFromDB());
      setResults(getResultsFromDB());
      try {
        const updatedLogsStr = localStorage.getItem("FF_CBT_ACTIVITY_LOGS") || "[]";
        setActivityLogs(JSON.parse(updatedLogsStr));
      } catch (e) {
        console.error("Failed to parse activity logs on sync:", e);
      }
      try {
        const updatedUsersStr = localStorage.getItem("FF_CBT_USERS") || "[]";
        setUsers(JSON.parse(updatedUsersStr));
      } catch (e) {
        console.error("Failed to parse users on sync:", e);
      }
    }

    // Subscribe to immediate real-time event notifications or focus shifts
    window.addEventListener("cbt-db-synced", handleCbtDbSynced);
    window.addEventListener("focus", handleCbtDbSynced);

    return () => {
      window.removeEventListener("cbt-db-synced", handleCbtDbSynced);
      window.removeEventListener("focus", handleCbtDbSynced);
    };
  }, []);

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError("");
    const emailLower = newUserForm.email.toLowerCase().trim();
    if (users.some(u => u.email.toLowerCase() === emailLower)) {
      setUserFormError("This email is already registered inside CBT Database!");
      return;
    }

    try {
      setIsCloudSaving(true);
      setCloudSaveMessage("Adding user and pushing to central storage...");
      
      let studentId: string | undefined;
      if (newUserForm.role === UserRole.STUDENT) {
        const studentNum = users.filter(u => u.role === UserRole.STUDENT).length + 101;
        studentId = `FF/JSS3/${studentNum}`;
      }

      const newUserObj: User = {
        id: newUserForm.role === UserRole.ADMIN ? `admin_${Date.now()}` : `stud_${Date.now()}`,
        email: emailLower,
        fullName: newUserForm.fullName.trim(),
        role: newUserForm.role,
        registrationDate: new Date().toISOString(),
        ...(studentId ? { studentId } : {})
      };

      const updatedUsers = [...users, newUserObj];
      setUsers(updatedUsers);
      localStorage.setItem("FF_CBT_USERS", JSON.stringify(updatedUsers));

      // Passwords update
      const passwords = JSON.parse(localStorage.getItem("FF_CBT_PASSWORDS") || "{}");
      passwords[emailLower] = newUserForm.password || "password123";
      localStorage.setItem("FF_CBT_PASSWORDS", JSON.stringify(passwords));

      // Push to central database
      await pushCollectionToServer("users", updatedUsers);
      await pushCollectionToServer("passwords", passwords);

      logActivity(user.id, user.fullName, UserRole.ADMIN, "Create User Account", `Administrator created new ${newUserForm.role.toLowerCase()} account: ${newUserObj.fullName} (${newUserObj.email})`);

      setIsAddUserOpen(false);
      setNewUserForm({
        fullName: "",
        email: "",
        password: "",
        role: UserRole.STUDENT
      });
    } catch (err: any) {
      setUserFormError(err.message || "Failed to create user.");
    } finally {
      setIsCloudSaving(false);
    }
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setUserFormError("");

    const emailLower = editingUser.email.toLowerCase().trim();
    const duplicate = users.find(u => u.email.toLowerCase() === emailLower && u.id !== editingUser.id);
    if (duplicate) {
      setUserFormError("This email is already registered inside CBT Database!");
      return;
    }

    try {
      setIsCloudSaving(true);
      setCloudSaveMessage("Updating user record dynamically...");

      let studentId = editingUser.studentId;
      if (editingUser.role === UserRole.STUDENT && !studentId) {
        const studentNum = users.filter(u => u.role === UserRole.STUDENT).length + 101;
        studentId = `FF/JSS3/${studentNum}`;
      } else if (editingUser.role !== UserRole.STUDENT) {
        studentId = undefined;
      }

      const updatedUserObj: User = {
        ...editingUser,
        fullName: editingUser.fullName.trim(),
        email: emailLower,
        studentId
      };

      const updatedUsers = users.map(u => u.id === editingUser.id ? updatedUserObj : u);
      setUsers(updatedUsers);
      localStorage.setItem("FF_CBT_USERS", JSON.stringify(updatedUsers));

      await pushCollectionToServer("users", updatedUsers);

      logActivity(user.id, user.fullName, UserRole.ADMIN, "Update User Account", `Administrator updated account: ${updatedUserObj.fullName} (${updatedUserObj.email})`);

      setEditingUser(null);
    } catch (err: any) {
      setUserFormError(err.message || "Failed to update user.");
    } finally {
      setIsCloudSaving(false);
    }
  };

  const handleDeleteUser = async (userToDelete: User) => {
    if (userToDelete.id === user.id) {
      alert("Operational constraint: You cannot delete your own active session!");
      return;
    }
    if (confirm(`Are you sure you want to delete account: ${userToDelete.fullName} (${userToDelete.email}) permanently? This will prevent them from signing in.`)) {
      try {
        setIsCloudSaving(true);
        setCloudSaveMessage("Removing user registration from DB...");

        const updatedUsers = users.filter(u => u.id !== userToDelete.id);
        setUsers(updatedUsers);
        localStorage.setItem("FF_CBT_USERS", JSON.stringify(updatedUsers));

        // Remove passwords entry to keep it clean
        const passwords = JSON.parse(localStorage.getItem("FF_CBT_PASSWORDS") || "{}");
        delete passwords[userToDelete.email.toLowerCase()];
        localStorage.setItem("FF_CBT_PASSWORDS", JSON.stringify(passwords));

        await pushCollectionToServer("users", updatedUsers);
        await pushCollectionToServer("passwords", passwords);

        logActivity(user.id, user.fullName, UserRole.ADMIN, "Delete User Account", `Administrator permanently deleted user: ${userToDelete.fullName} (${userToDelete.email})`);
      } catch (err: any) {
        alert("Failed to delete user: " + err.message);
      } finally {
        setIsCloudSaving(false);
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      parseFileAndPopulate(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseFileAndPopulate(e.target.files[0]);
    }
  };

  const parseFileAndPopulate = (file: File) => {
    setFileImportError("");
    setFileImportSuccess("");
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("Could not load file data.");
        
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to array of arrays to handle column positions easily
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        if (rows.length < 2) {
          throw new Error("Empty worksheet or invalid formatting. Header row is required.");
        }
        
        const headers = rows[0].map((h) => String(h || "").trim().toLowerCase());
        const subIdx = headers.findIndex((h) => h.includes("subject") || h === "sub");
        const qIdx = headers.findIndex((h) => h.includes("question") || h === "q" || h.includes("text"));
        const optA = headers.findIndex((h) => h.includes("option a") || h === "a" || h === "opt_a");
        const optB = headers.findIndex((h) => h.includes("option b") || h === "b" || h === "opt_b");
        const optC = headers.findIndex((h) => h.includes("option c") || h === "c" || h === "opt_c");
        const optD = headers.findIndex((h) => h.includes("option d") || h === "d" || h === "opt_d");
        const ansIdx = headers.findIndex((h) => h.includes("correct") || h.includes("answer") || h === "ans");
        const expIdx = headers.findIndex((h) => h.includes("explanation") || h === "exp");
        const diffIdx = headers.findIndex((h) => h.includes("difficulty") || h === "diff");
        const topicIdx = headers.findIndex((h) => h.includes("topic") || h.includes("category") || h === "subtopic");

        if (qIdx === -1 || optA === -1 || optB === -1) {
          throw new Error("Missing mandatory headers. File MUST have 'Question', 'Option A', 'Option B' columns.");
        }

        const parsedList: Question[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          
          const qVal = String(row[qIdx] || "").trim();
          if (!qVal) continue;

          let subjectId = "maths";
          if (importSubjectOverride !== "auto") {
            subjectId = importSubjectOverride;
          } else {
            let rawSub = subIdx !== -1 && row[subIdx] ? String(row[subIdx]).trim().toLowerCase() : "maths";
            if (rawSub.includes("math")) subjectId = "maths";
            else if (rawSub.includes("english")) subjectId = "english";
            else if (rawSub.includes("basic science") || rawSub.includes("science_tech") || rawSub.includes("basic_science") || rawSub.includes("tech")) subjectId = "basic_science_tech";
            else if (rawSub.includes("prevocational") || rawSub.includes("prevoc") || rawSub.includes("agric")) subjectId = "prevocational_studies";
            else if (rawSub.includes("national") || rawSub.includes("civic")) subjectId = "national_value";
            else if (rawSub.includes("business")) subjectId = "business_studies";
            else if (rawSub.includes("yoruba")) subjectId = "yoruba";
            else {
              const match = SUBJECTS.find((s) => s.id === rawSub);
              if (match) subjectId = match.id;
            }
          }

          const aVal = optA !== -1 && row[optA] !== undefined ? String(row[optA]).trim() : "";
          const bVal = optB !== -1 && row[optB] !== undefined ? String(row[optB]).trim() : "";
          const cVal = optC !== -1 && row[optC] !== undefined ? String(row[optC]).trim() : "";
          const dVal = optD !== -1 && row[optD] !== undefined ? String(row[optD]).trim() : "";
          
          let ansVal = ansIdx !== -1 && row[ansIdx] !== undefined ? String(row[ansIdx]).trim() : aVal;
          const cleanAns = ansVal.toLowerCase();
          if (cleanAns === "a" || cleanAns === "option a" || cleanAns === "optiona") {
            ansVal = aVal;
          } else if (cleanAns === "b" || cleanAns === "option b" || cleanAns === "optionb") {
            ansVal = bVal;
          } else if (cleanAns === "c" || cleanAns === "option c" || cleanAns === "optionc") {
            ansVal = cVal;
          } else if (cleanAns === "d" || cleanAns === "option d" || cleanAns === "optiond") {
            ansVal = dVal;
          }

          const expVal = expIdx !== -1 && row[expIdx] !== undefined ? String(row[expIdx]).trim() : "Verified JSS3 BECE CBT Guideline.";
          
          let diffVal: "Easy" | "Medium" | "Hard" = "Medium";
          if (diffIdx !== -1 && row[diffIdx]) {
            const dr = String(row[diffIdx]).trim().toLowerCase();
            if (dr.includes("easy")) diffVal = "Easy";
            else if (dr.includes("hard")) diffVal = "Hard";
          }
          const topicVal = topicIdx !== -1 && row[topicIdx] !== undefined ? String(row[topicIdx]).trim() : "Core General";

          const opts = [aVal, bVal, cVal, dVal].filter(Boolean);
          if (opts.length < 2) continue; // Skip invalid lines

          parsedList.push({
            id: `picked_gen_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
            subjectId,
            questionText: qVal,
            options: opts,
            originalOptions: [...opts],
            correctAnswer: ansVal,
            explanation: expVal,
            difficulty: diffVal,
            topic: topicVal
          });
        }

        if (parsedList.length === 0) {
          throw new Error("No valid JSS3 questions could be extracted from this spreadsheet.");
        }

        setUploadedQuestions(parsedList);
        const initChecked: Record<string, boolean> = {};
        parsedList.forEach((q) => {
          initChecked[q.id] = true;
        });
        setSelectedUploadIds(initChecked);
        setFileImportSuccess(`Successfully parsed ${parsedList.length} questions from "${file.name}". Choose/pick the ones you want to import below!`);
      } catch (err: any) {
        setFileImportError(`Failed to parse file: ${err.message || err}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImportSelectedQuestions = async () => {
    const selectedList = uploadedQuestions.filter((q) => selectedUploadIds[q.id]);
    if (selectedList.length === 0) {
      alert("No questions selected. Please tick the questions you want to add.");
      return;
    }

    setIsCloudSaving(true);
    setCloudSaveMessage("Merging, compiling and uploading picked questions to database...");

    try {
      const currentDB = getQuestionsFromDB();
      const formattedSelected = selectedList.map((q, idx) => {
        const dbId = `${q.subjectId}_imported_${Date.now()}_${idx}`;
        return {
          ...q,
          id: dbId,
          isUploaded: true, // Prioritize this custom Excel upload!
          originalOptions: [...q.options]
        };
      });

      const newMergedDB = [...formattedSelected, ...currentDB];
      
      setCloudSaveMessage("Syncing complete question bank with Supabase Cloud...");
      const syncOk = await saveQuestionsToDB(newMergedDB);

      logActivity(
        user.id,
        user.fullName,
        UserRole.ADMIN,
        "Upload sheet questions",
        `Uploaded and picked ${formattedSelected.length} questions from Excel/CSV file.`
      );

      setUploadedQuestions([]);
      setSelectedUploadIds({});
      setQuestions(newMergedDB);
      
      if (syncOk) {
        setFileImportSuccess(`Successfully added and cloud-synchronized ${formattedSelected.length} picked questions with Supabase!`);
      } else {
        setFileImportSuccess(`Successfully added ${formattedSelected.length} questions locally. Note: Cloud synchronization failed. Setup SQL table if needed.`);
      }
      setTimeout(() => setFileImportSuccess(""), 6000);
    } catch (err: any) {
      alert(`Failed to save: ${err.message || err}`);
    } finally {
      setIsCloudSaving(false);
      setCloudSaveMessage("");
    }
  };

  const resultsList = results;
  const studentsCount = users.filter((u: any) => u.role === "STUDENT").length;

  const handleRefreshDB = () => {
    setQuestions(getQuestionsFromDB());
    setActivityLogs(getActivityLogs());
    setResults(getResultsFromDB());
    try {
      setUsers(JSON.parse(localStorage.getItem("FF_CBT_USERS") || "[]"));
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAdd = () => {
    setNewQForm({
      subjectId: "maths",
      questionText: "",
      optA: "",
      optB: "",
      optC: "",
      optD: "",
      correctAnswer: "",
      explanation: "",
      difficulty: "Medium",
      topic: "Core Foundations"
    });
    setIsAddOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQForm.questionText || !newQForm.optA || !newQForm.optB) {
      alert("Please complete the Question field and Option keys!");
      return;
    }

    setIsCloudSaving(true);
    setCloudSaveMessage("Adding and synchronizing new question with Supabase Cloud...");

    try {
      const list = getQuestionsFromDB();
      const newId = `manual_add_${Date.now()}`;
      const opts = [newQForm.optA, newQForm.optB, newQForm.optC, newQForm.optD].filter(Boolean);
      
      let ansVal = (newQForm.correctAnswer || newQForm.optA).trim();
      const cleanAns = ansVal.toLowerCase().replace(/[.)\s]+/g, "");
      if (cleanAns === "a" || cleanAns === "optiona" || cleanAns === "1") {
        ansVal = newQForm.optA;
      } else if (cleanAns === "b" || cleanAns === "optionb" || cleanAns === "2") {
        ansVal = newQForm.optB;
      } else if (cleanAns === "c" || cleanAns === "optionc" || cleanAns === "3") {
        ansVal = newQForm.optC;
      } else if (cleanAns === "d" || cleanAns === "optiond" || cleanAns === "4") {
        ansVal = newQForm.optD;
      }

      const fullQ: Question = {
        id: newId,
        subjectId: newQForm.subjectId,
        questionText: newQForm.questionText,
        options: opts,
        originalOptions: [...opts],
        correctAnswer: ansVal,
        explanation: newQForm.explanation || "No explanation provided.",
        difficulty: newQForm.difficulty,
        topic: newQForm.topic || "General Study",
        isUploaded: true
      };
      
      list.unshift(fullQ);
      const syncOk = await saveQuestionsToDB(list);

      logActivity(user.id, user.fullName, UserRole.ADMIN, "Add Question", `Added a new manual JSS3 question: "${newQForm.questionText.slice(0, 40)}..."`);
      
      setIsAddOpen(false);
      handleRefreshDB();
      
      if (syncOk) {
        alert("New BECE CBT Question created and cloud-synchronized successfully!");
      } else {
        alert("New Question created locally. Note: Cloud synchronization failed. Please check Supabase table status.");
      }
    } catch (err: any) {
      alert(`Failed to add: ${err.message || err}`);
    } finally {
      setIsCloudSaving(false);
      setCloudSaveMessage("");
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    setIsCloudSaving(true);
    setCloudSaveMessage("Synchronizing updated question with Supabase Cloud...");

    try {
      const list = getQuestionsFromDB();
      const idx = list.findIndex((q) => q.id === editingQuestion.id);
      if (idx !== -1) {
        let ansVal = (editingQuestion.correctAnswer || "").trim();
        const cleanAns = ansVal.toLowerCase().replace(/[.)\s]+/g, "");
        let updatedAns = editingQuestion.correctAnswer;
        
        if (cleanAns === "a" || cleanAns === "optiona" || cleanAns === "1") {
          updatedAns = editingQuestion.options[0] || editingQuestion.correctAnswer;
        } else if (cleanAns === "b" || cleanAns === "optionb" || cleanAns === "2") {
          updatedAns = editingQuestion.options[1] || editingQuestion.correctAnswer;
        } else if (cleanAns === "c" || cleanAns === "optionc" || cleanAns === "3") {
          updatedAns = editingQuestion.options[2] || editingQuestion.correctAnswer;
        } else if (cleanAns === "d" || cleanAns === "optiond" || cleanAns === "4") {
          updatedAns = editingQuestion.options[3] || editingQuestion.correctAnswer;
        }

        list[idx] = { 
          ...editingQuestion, 
          correctAnswer: updatedAns,
          originalOptions: [...editingQuestion.options] 
        };
        const syncOk = await saveQuestionsToDB(list);
        
        logActivity(user.id, user.fullName, UserRole.ADMIN, "Edit Question", `Admin edited question: "${editingQuestion.questionText.slice(0, 40)}..."`);
        setEditingQuestion(null);
        handleRefreshDB();
        
        if (syncOk) {
          alert("Question updated and synchronized to Cloud successfully!");
        } else {
          alert("Question updated locally. Note: Cloud sync failed.");
        }
      }
    } catch (err: any) {
      alert(`Failed to save question update: ${err.message || err}`);
    } finally {
      setIsCloudSaving(false);
      setCloudSaveMessage("");
    }
  };

  const handleDeleteQ = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this question from the CBT database?")) {
      setIsCloudSaving(true);
      setCloudSaveMessage("Removing question and syncing database state...");
      
      try {
        const list = getQuestionsFromDB();
        const filtered = list.filter((q) => q.id !== id);
        const syncOk = await saveQuestionsToDB(filtered);
        
        logActivity(user.id, user.fullName, UserRole.ADMIN, "Delete Question", `Deleted question with ID: ${id}`);
        handleRefreshDB();
        
        if (syncOk) {
          alert("Question deleted and synchronized successfully!");
        } else {
          alert("Question deleted locally. Note: Cloud sync failed.");
        }
      } catch (err: any) {
        alert(`Failed to delete question: ${err.message || err}`);
      } finally {
        setIsCloudSaving(false);
        setCloudSaveMessage("");
      }
    }
  };

  // CSV Bulk Importer Logic
  const handleCsvImport = async () => {
    if (!csvText.trim()) {
      setBulkError("CSV input area is empty. Please paste valid CSV lines.");
      return;
    }

    setIsCloudSaving(true);
    setCloudSaveMessage("Importing and synchronizing CSV questions with Supabase Cloud...");

    try {
      const rows = csvText.split("\n");
      if (rows.length < 2) {
        setBulkError("Insufficient rows. First row must serve as matching Column headers.");
        setIsCloudSaving(false);
        setCloudSaveMessage("");
        return;
      }

      // Parse headers (Case insensitive trim)
      const headers = rows[0].split(",").map((h) => h.trim().toLowerCase());
      const subIdx = headers.findIndex((h) => h.includes("subject"));
      const qIdx = headers.findIndex((h) => h.includes("question"));
      const optA = headers.findIndex((h) => h.includes("option a") || h === "a");
      const optB = headers.findIndex((h) => h.includes("option b") || h === "b");
      const optC = headers.findIndex((h) => h.includes("option c") || h === "c");
      const optD = headers.findIndex((h) => h.includes("option d") || h === "d");
      const ansIdx = headers.findIndex((h) => h.includes("correct") || h.includes("answer"));
      const expIdx = headers.findIndex((h) => h.includes("explanation") || h.includes("explain"));
      const diffIdx = headers.findIndex((h) => h.includes("difficulty"));
      const topicIdx = headers.findIndex((h) => h.includes("topic") || h.includes("category"));

      if (qIdx === -1 || optA === -1 || optB === -1) {
        setBulkError("Formatting missing. Essential columns 'Question', 'Option A', 'Option B' are required.");
        return;
      }

      const list = getQuestionsFromDB();
      let addedCount = 0;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i].trim();
        if (!row) continue;

        // Custom split to ignore commas inside quotes
        const cols: string[] = [];
        let insideQuote = false;
        let entry = "";
        for (let char of row) {
          if (char === '"') {
            insideQuote = !insideQuote;
          } else if (char === "," && !insideQuote) {
            cols.push(entry.trim());
            entry = "";
          } else {
            entry += char;
          }
        }
        cols.push(entry.trim());

        if (cols.length < 3) continue;

        let subjectVal = "maths";
        if (importSubjectOverride !== "auto") {
          subjectVal = importSubjectOverride;
        } else {
          const rawCol = subIdx !== -1 && cols[subIdx] ? cols[subIdx].trim().toLowerCase() : "maths";
          if (rawCol.includes("math")) subjectVal = "maths";
          else if (rawCol.includes("english")) subjectVal = "english";
          else if (rawCol.includes("basic science") || rawCol.includes("science_tech") || rawCol.includes("basic_science") || rawCol.includes("tech")) subjectVal = "basic_science_tech";
          else if (rawCol.includes("prevocational") || rawCol.includes("prevoc") || rawCol.includes("agric")) subjectVal = "prevocational_studies";
          else if (rawCol.includes("national") || rawCol.includes("civic")) subjectVal = "national_value";
          else if (rawCol.includes("business")) subjectVal = "business_studies";
          else if (rawCol.includes("yoruba")) subjectVal = "yoruba";
          else {
            const match = SUBJECTS.find((s) => s.id === rawCol);
            if (match) subjectVal = match.id;
          }
        }

        const qVal = cols[qIdx];
        const aVal = cols[optA];
        const bVal = cols[optB];
        const cVal = optC !== -1 && cols[optC] ? cols[optC] : "";
        const dVal = optD !== -1 && cols[optD] ? cols[optD] : "";
        let ansVal = ansIdx !== -1 && cols[ansIdx] ? cols[ansIdx].trim() : aVal;
        const expVal = expIdx !== -1 && cols[expIdx] ? cols[expIdx] : "Imported verification.";
        const diffVal: "Easy" | "Medium" | "Hard" =
          diffIdx !== -1 && (cols[diffIdx] === "Easy" || cols[diffIdx] === "Hard")
            ? (cols[diffIdx] as "Easy" | "Hard")
            : "Medium";
        const topicVal = topicIdx !== -1 && cols[topicIdx] ? cols[topicIdx] : "Imported Topic";

        const opts = [aVal, bVal, cVal, dVal].filter(Boolean);

        // Translate A., Option A, C), etc. to the actual option text
        const cleanAns = ansVal.toLowerCase().replace(/[.)\s]+/g, "");
        if (cleanAns === "a" || cleanAns === "optiona" || cleanAns === "1") {
          ansVal = aVal;
        } else if (cleanAns === "b" || cleanAns === "optionb" || cleanAns === "2") {
          ansVal = bVal;
        } else if (cleanAns === "c" || cleanAns === "optionc" || cleanAns === "3") {
          ansVal = cVal;
        } else if (cleanAns === "d" || cleanAns === "optiond" || cleanAns === "4") {
          ansVal = dVal;
        }

        list.unshift({
          id: `${subjectVal}_bulk_${Date.now()}_${i}`,
          subjectId: subjectVal,
          questionText: qVal,
          options: opts,
          originalOptions: [...opts],
          correctAnswer: ansVal,
          explanation: expVal,
          difficulty: diffVal,
          topic: topicVal,
          isUploaded: true
        });

        addedCount++;
      }

      const syncOk = await saveQuestionsToDB(list);
      logActivity(user.id, user.fullName, UserRole.ADMIN, "Import Questions", `Bulk-imported ${addedCount} questions via pasted CSV data.`);

      setQuestions(list);
      if (syncOk) {
        setBulkSuccess(`Success! Completed bulk uploading & cloud-synchronizing of ${addedCount} questions right into Supabase!`);
      } else {
        setBulkSuccess(`Success! Bulk uploaded ${addedCount} questions locally (Note: Cloud connection not active).`);
      }
      setBulkError("");
      setCsvText("");
      setTimeout(() => setBulkSuccess(""), 4000);
    } catch (e: any) {
      setBulkError(`Upload failed: ${e.message}`);
    } finally {
      setIsCloudSaving(false);
      setCloudSaveMessage("");
    }
  };

  const handleExportResultsCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,StudentName,RegId,Subject,PercentScore,Score,Grade,Mode,Date\n";
    resultsList.forEach((r) => {
      csvContent += `${r.studentName},${r.studentRegId},${r.subjectName},${r.percentage}%,${r.correctAnswers}/${r.totalQuestions},${r.grade},${r.isMock ? "Mock" : "Practice"},${new Date(r.date).toLocaleDateString()}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FF_CBT_BECE_Results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Tracing questions count per subject
  const subjectChartData = SUBJECTS.map((sub) => {
    const totalQ = questions.filter((q) => q.subjectId === sub.id).length;
    const takenExams = resultsList.filter((r) => r.subjectId === sub.id);
    const avgScore =
      takenExams.length > 0
        ? Math.round(takenExams.reduce((acc, c) => acc + c.percentage, 0) / takenExams.length)
        : 0;

    return {
      name: sub.name.slice(0, 8),
      fullName: sub.name,
      questions: totalQ,
      averageScore: avgScore
    };
  });

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) || q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject ? q.subjectId === filterSubject : true;
    return matchesSearch && matchesSubject;
  });

  const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#14b8a6", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#14b8a6"];

  return (
    <div className={`min-h-screen ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      {/* NAVBAR */}
      <header className={`sticky top-0 z-45 border-b backdrop-blur-md transition-colors ${darkMode ? "bg-slate-950/90 border-slate-800/60 text-slate-100" : "bg-white/95 border-slate-200/60 text-slate-850 shadow-xs"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={schoolLogo} 
              alt="Faith Foundation School Seal" 
              className="w-10 h-10 object-contain rounded-full shadow-md bg-white border border-slate-205/60" 
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase leading-none font-serif">FAITH FOUNDATION</h1>
              <p className={`text-[9px] font-mono tracking-wider uppercase mt-0.5 ${darkMode ? "text-slate-400" : "text-indigo-600"}`}>ADMIN CONTROL CENTER</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Real-time Supabase Cloud Integration Status */}
            {supabaseStatus && (
              <button
                onClick={() => {
                  if (!supabaseStatus.supabaseConfigured || !supabaseStatus.supabaseConnected || !supabaseStatus.tableExists) {
                    setActiveSegment("stats");
                    setShowSqlGuide(true);
                    setTimeout(() => {
                      const el = document.getElementById("supabase-panel");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }
                }}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
                  supabaseStatus.supabaseConfigured && supabaseStatus.supabaseConnected && supabaseStatus.tableExists
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-sans"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-450 hover:border-amber-500 animation-pulse font-sans"
                }`}
                title={
                  supabaseStatus.supabaseConfigured && supabaseStatus.supabaseConnected && supabaseStatus.tableExists
                    ? "Supabase synchronized connection active! Live sharing is fully enabled."
                    : "Caution: Using local storage backup. Click here to configure secure central cloud sharing."
                }
              >
                <div className={`w-1.5 h-1.5 rounded-full ${
                  supabaseStatus.supabaseConfigured && supabaseStatus.supabaseConnected && supabaseStatus.tableExists
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-amber-500"
                }`} />
                <span>
                  {supabaseStatus.supabaseConfigured && supabaseStatus.supabaseConnected && supabaseStatus.tableExists
                    ? "Supabase Integrated"
                    : "Local-Only Backup (Cloud Disconnected)"}
                </span>
              </button>
            )}

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${darkMode ? "border-slate-800 text-amber-405 hover:bg-slate-805" : "border-slate-200 text-slate-600 hover:bg-slate-100 bg-white shadow-xs"}`}
            >
              <LucideIcon name={darkMode ? "Sun" : "Moon"} size={14} />
            </button>

            <div className={`flex items-center gap-3 border-l pl-4 ${darkMode ? "border-slate-800" : "border-slate-200"}`}>
              <div className="hidden md:block text-right">
                <div className={`text-xs font-bold ${darkMode ? "text-indigo-400" : "text-slate-850"}`}>Admin Coordinator</div>
                <div className={`text-[10px] uppercase font-mono ${darkMode ? "text-slate-400" : "text-slate-450"}`}>MASTER AUTHORITY</div>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                title="Log out"
                id="admin-logout"
              >
                <LucideIcon name="LogOut" size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* BODY CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* TOP METRICS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={`p-6 rounded-3xl border ${darkMode ? "bg-slate-900 border-slate-800/80" : "bg-white border-slate-200/85"} flex items-center justify-between shadow-sm`}>
            <div>
              <div className="text-2xl font-bold font-mono text-indigo-650 dark:text-indigo-450">{questions.length}</div>
              <div className="text-[9px] uppercase font-bold text-slate-450 tracking-wider">QUESTIONS BANK</div>
            </div>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 rounded-xl">
              <LucideIcon name="Database" size={20} />
            </div>
          </div>

          <div className={`p-6 rounded-3xl border ${darkMode ? "bg-slate-900 border-slate-800/80" : "bg-white border-slate-200/85"} flex items-center justify-between shadow-sm`}>
            <div>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{studentsCount}</div>
              <div className="text-[9px] uppercase font-bold text-slate-450 tracking-wider">REGISTERED STUDENTS</div>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/45 text-emerald-600 rounded-xl">
              <LucideIcon name="Users" size={20} />
            </div>
          </div>

          <div className={`p-6 rounded-3xl border ${darkMode ? "bg-slate-900 border-slate-800/80" : "bg-white border-slate-200/85"} flex items-center justify-between shadow-sm`}>
            <div>
              <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">{resultsList.length}</div>
              <div className="text-[9px] uppercase font-bold text-slate-455 tracking-wider">TESTS COMPLETED</div>
            </div>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/45 text-purple-600 rounded-xl">
              <LucideIcon name="ClipboardList" size={20} />
            </div>
          </div>

          <div className={`p-6 rounded-3xl border ${darkMode ? "bg-slate-900 border-slate-800/80" : "bg-white border-slate-200/85"} flex items-center justify-between shadow-sm`}>
            <div>
              <div className="text-2xl font-bold font-mono text-amber-500">
                {resultsList.length > 0
                  ? `${Math.round(resultsList.reduce((acc, c) => acc + c.percentage, 0) / resultsList.length)}%`
                  : "0%"}
              </div>
              <div className="text-[9px] uppercase font-bold text-slate-455 tracking-wider">AVERAGE MARK</div>
            </div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/45 text-amber-550 rounded-xl">
              <LucideIcon name="TrendingUp" size={20} />
            </div>
          </div>
        </div>

        {/* ADMIN NAV BAR */}
        <div className="border-b border-slate-250 dark:border-slate-800 flex gap-4 overflow-x-auto pb-1 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveSegment("stats")}
            className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${activeSegment === "stats" ? "border-indigo-600 text-indigo-650 dark:text-indigo-400" : "border-transparent text-slate-405 hover:text-slate-600"}`}
          >
            <LucideIcon name="BarChart" size={13} /> CBT Metrics & Reports
          </button>
          <button
            onClick={() => setActiveSegment("bank")}
            className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${activeSegment === "bank" ? "border-indigo-600 text-indigo-650 dark:text-indigo-450" : "border-transparent text-slate-405 hover:text-slate-600"}`}
          >
            <LucideIcon name="HelpCircle" size={13} /> Question Bank ({questions.length})
          </button>
          <button
            onClick={() => setActiveSegment("results")}
            className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${activeSegment === "results" ? "border-indigo-600 text-indigo-650 dark:text-indigo-400 font-bold" : "border-transparent text-slate-405 hover:text-slate-600"}`}
          >
            <LucideIcon name="Award" size={13} /> Student Exam Results ({results.length})
          </button>
          <button
            onClick={() => setActiveSegment("users")}
            className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${activeSegment === "users" ? "border-indigo-600 text-indigo-650 dark:text-indigo-400 font-bold" : "border-transparent text-slate-405 hover:text-slate-600"}`}
          >
            <LucideIcon name="Users" size={13} /> Registered Accounts ({users.length})
          </button>
          <button
            onClick={() => setActiveSegment("logs")}
            className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${activeSegment === "logs" ? "border-indigo-600 text-indigo-650 dark:text-indigo-455" : "border-transparent text-slate-405 hover:text-slate-600"}`}
          >
            <LucideIcon name="Activity" size={13} /> Student Activity Logs ({activityLogs.length})
          </button>
          <button
            onClick={() => setActiveSegment("diagnostics")}
            className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${activeSegment === "diagnostics" ? "border-emerald-650 text-emerald-655 dark:text-emerald-400 font-bold" : "border-transparent text-slate-405 hover:text-slate-600"}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Database Health Check
          </button>
        </div>

        {/* ACTIVE CONTAINER */}
        <div>
          {/* STATS ANALYTICS TAB */}
          {activeSegment === "stats" && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left BarChart panel */}
              <div className={`p-6 rounded-2xl border-2 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} lg:col-span-2 space-y-6 shadow-sm`}>
                <div className="flex justify-between items-center border-b-2 pb-3 border-slate-100 dark:border-slate-800">
                  <h3 className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                    <LucideIcon name="BarChart2" className="text-blue-600 dark:text-blue-400" /> Subject database allocation density
                  </h3>
                  <span className="text-[9px] bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-md font-black uppercase text-slate-450 tracking-wider">QUESTIONS</span>
                </div>

                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} />
                      <YAxis stroke="#888888" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: darkMode ? "#0f172a" : "#ffffff",
                          borderColor: darkMode ? "#334155" : "#e2e8f0",
                          borderRadius: "12px",
                          borderWidth: "2px",
                          fontSize: "11px",
                          fontWeight: "bold"
                        }}
                      />
                      <Bar dataKey="questions" radius={[4, 4, 0, 0]}>
                        {subjectChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right Export / Manage Actions column */}
              <div className="space-y-6 lg:col-span-1">
                <div className={`p-6 rounded-2xl border-2 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} space-y-4 shadow-sm`}>
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white border-b-2 pb-2 border-slate-100 dark:border-slate-800">CBT Administrative Tasks</h4>

                  <div className="space-y-3">
                    <button
                      onClick={handleExportResultsCSV}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <LucideIcon name="FileDown" size={14} /> Export Results to Excel/CSV
                    </button>

                    <button
                      onClick={handleRefreshDB}
                      className="w-full py-3 bg-blue-900 dark:bg-blue-600/10 hover:bg-blue-800 dark:hover:bg-blue-600/20 text-white dark:text-blue-400 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-transparent dark:border-blue-500/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <LucideIcon name="RefreshCw" size={12} /> Sync Local Database Caches
                    </button>
                  </div>
                </div>

                <div className={`p-6 rounded-2xl border-2 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} space-y-4 shadow-sm`}>
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white border-b-2 pb-2 border-slate-100 dark:border-slate-800">Exam Blueprint metrics</h4>
                  <p className="text-[11px] text-slate-450 leading-normal font-medium">
                    The platform enforces 1 minute per question default timing constraints. Automatic shuffling prevents unauthorized candidates from swapping keys or options during concurrent lab deployment.
                  </p>
                  <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-wider pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>Default Bounds:</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 text-xs">20 - 80 questions</span>
                  </div>
                </div>

                {/* SUPABASE MULTI-DEVICE CLOUD SYNC CARD */}
                <div className={`p-6 rounded-2xl border-2 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} space-y-4 shadow-sm`}>
                  <div className="flex justify-between items-center border-b-2 pb-2 border-slate-100 dark:border-slate-800">
                    <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                      <LucideIcon name="CloudLightning" className="text-amber-500" /> Multi-Device Cloud Sync
                    </h4>
                    <span className="text-[8px] bg-slate-105 dark:bg-slate-950 px-2 py-0.5 rounded font-black text-indigo-500">SUPABASE</span>
                  </div>

                  {supabaseStatus ? (
                    <div className="space-y-3 text-xs">
                      {/* Scenario 1: Supabase Fully Active and Configured */}
                      {supabaseStatus.supabaseConfigured && supabaseStatus.supabaseConnected && supabaseStatus.tableExists && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-505 animate-ping"></div>
                            <div className="leading-tight">
                              <p className="font-bold text-emerald-600 dark:text-emerald-450">Cloud Connection Active</p>
                              <p className="text-[10px] text-slate-400">Sync is live across all gadget browsers!</p>
                            </div>
                          </div>
                          
                          <div className="p-3 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
                            <p className="font-bold text-slate-600 dark:text-slate-350 text-[11px] uppercase tracking-wider">Storage Sync Verified</p>
                            <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-550 font-mono">
                              <div className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded flex items-center justify-between">
                                <span>DB Table:</span> <span className="text-emerald-550">READY</span>
                              </div>
                              <div className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded flex items-center justify-between">
                                <span>Sync:</span> <span className="text-emerald-555">LIVE</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Scenario 2: Configured but Table Missing */}
                      {supabaseStatus.supabaseConfigured && (!supabaseStatus.tableExists || !supabaseStatus.supabaseConnected) && (
                        <div className="space-y-3">
                          <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl space-y-1.5">
                            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                              <LucideIcon name="AlertTriangle" size={14} />
                              <span>Table Creation Required</span>
                            </div>
                            <p className="text-[10.5px] text-slate-400 leading-normal">
                              Keys detected, but table <code className="font-mono text-xs text-rose-500">cbt_sync_store</code> needs setup in your Supabase SQL Editor.
                            </p>
                          </div>

                          <button
                            onClick={() => setShowSqlGuide(!showSqlGuide)}
                            className="w-full py-2 bg-amber-600 hover:bg-amber-705 text-white rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <LucideIcon name="Code" size={12} />
                            {showSqlGuide ? "Hide Setup Guide" : "Get Database Setup SQL"}
                          </button>

                          {showSqlGuide && (
                            <div className="space-y-2 p-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                              <p className="text-[10px] text-slate-400 font-medium leading-normal">
                                1. Open your <strong>Supabase Dashboard</strong>.<br />
                                2. Go to <strong>SQL Editor</strong> &gt; <strong>New Query</strong>.<br />
                                3. Paste the code below and click <strong>Run</strong>:
                              </p>
                              <div className="relative">
                                <pre className="text-[9px] font-mono p-2.5 bg-slate-900 text-emerald-400 rounded-lg overflow-x-auto border border-slate-800 select-all max-h-40">
{`CREATE TABLE IF NOT EXISTS cbt_sync_store (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE cbt_sync_store DISABLE ROW LEVEL SECURITY;`}
                                </pre>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS cbt_sync_store (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE cbt_sync_store DISABLE ROW LEVEL SECURITY;`);
                                    setSqlCopied(true);
                                    setTimeout(() => setSqlCopied(false), 2000);
                                  }}
                                  className="absolute top-1 right-1 bg-slate-800 hover:bg-slate-705 border border-slate-755 p-1 rounded font-bold text-[9px] uppercase tracking-wider text-white"
                                >
                                  {sqlCopied ? "Copied!" : "Copy SQL"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Scenario 3: Supabase Keys Unconfigured */}
                      {!supabaseStatus.supabaseConfigured && (
                        <div className="space-y-3">
                          <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 p-3.5 rounded-xl space-y-1">
                            <p className="font-bold text-indigo-500 dark:text-indigo-400">Server fallback cached</p>
                            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                              Currently synchronizing multiple devices via live full-stack memory fallback.
                            </p>
                          </div>
                          
                          <div className="text-[10px] text-slate-400 leading-normal border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1">
                            <strong>To activate secure permanent Cloud Sync:</strong>
                            <ol className="list-decimal pl-3.5 mt-1 space-y-1">
                              <li>Open the <strong>Secrets Settings</strong> in your AI Studio dashboard menu.</li>
                              <li>Add <code className="font-mono text-[10px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-rose-500 px-1 py-0.5 rounded">SUPABASE_URL</code></li>
                              <li>Add <code className="font-mono text-[10px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-rose-500 px-1 py-0.5 rounded">SUPABASE_ANON_KEY</code></li>
                            </ol>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE BANK OF QUESTIONS */}
          {activeSegment === "bank" && (
            <div className="space-y-6">
              {/* TOP ACTION BAR */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Search by keyword, topic descriptor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border-2 text-xs font-bold outline-none focus:border-blue-600 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 w-full sm:w-64"
                  />

                  <select
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border-2 text-xs font-black uppercase tracking-wider outline-none bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                  >
                    <option value="">All Curriculum Subjects</option>
                    {SUBJECTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleOpenAdd}
                    className="px-4 py-3 bg-blue-900 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <LucideIcon name="Plus" size={14} /> Add CBT Question
                  </button>
                </div>
              </div>

              {/* UPLOADED QUESTIONS PREVIEW BOARD (PICK AND ADD) */}
              {uploadedQuestions.length > 0 && (
                <div className={`p-6 rounded-2xl border-2 border-blue-600/30 ${darkMode ? "bg-slate-900 bg-gradient-to-r from-blue-950/20 via-transparent to-transparent" : "bg-blue-50/25"} space-y-6 shadow-md`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 pb-3 border-slate-200 dark:border-slate-800 gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1 px-2.5 rounded bg-blue-600/10 text-blue-600 text-[10px] font-black uppercase tracking-wider">SHEET DISCOVERY METER</span>
                        <h3 className="font-mono text-xs text-slate-400 font-bold">Unsaved draft sheet lines</h3>
                      </div>
                      <h4 className="text-lg font-black uppercase tracking-tight text-slate-950 dark:text-white mt-1">
                        📥 PICK FROM SPREADSHEET (Parsed {uploadedQuestions.length} Items)
                      </h4>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs font-black uppercase tracking-wider">
                      <button
                        onClick={() => {
                          const updated = { ...selectedUploadIds };
                          uploadedQuestions.forEach(q => updated[q.id] = true);
                          setSelectedUploadIds(updated);
                        }}
                        className="px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-755 text-slate-750 dark:text-slate-300 rounded-lg text-[10px] transition-all font-black uppercase"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => {
                          const updated = { ...selectedUploadIds };
                          uploadedQuestions.forEach(q => updated[q.id] = false);
                          setSelectedUploadIds(updated);
                        }}
                        className="px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-755 text-slate-750 dark:text-slate-300 rounded-lg text-[10px] transition-all font-black uppercase"
                      >
                        Deselect All
                      </button>
                      <button
                        onClick={() => {
                          setUploadedQuestions([]);
                          setSelectedUploadIds({});
                        }}
                        className="px-3 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-lg text-[10px] transition-all uppercase font-black"
                      >
                        Dismiss Sheet
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-450 font-bold leading-relaxed">
                    Review and modify parsed spreadsheet lines below. Check or uncheck questions to selectively pick the options you wish to introduce into the core BECE database.
                  </p>

                  <div className="max-h-96 overflow-y-auto divide-y-2 divide-slate-150 dark:divide-slate-800/80 pr-1 space-y-4">
                    {uploadedQuestions.map((q, qIndex) => {
                      const isChecked = !!selectedUploadIds[q.id];
                      return (
                        <div
                          key={q.id}
                          className={`p-4 rounded-xl border-2 transition-all flex flex-col sm:flex-row gap-4 items-start ${
                            isChecked
                              ? darkMode
                                ? "bg-slate-950/60 border-blue-900/40"
                                : "bg-white border-blue-200"
                              : "border-slate-100 dark:border-slate-800/40 opacity-55"
                          }`}
                        >
                          <div className="pt-1 select-none shrink-0 flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                setSelectedUploadIds({
                                  ...selectedUploadIds,
                                  [q.id]: e.target.checked
                                });
                              }}
                              className="w-4.5 h-4.5 text-blue-600 rounded cursor-pointer"
                            />
                            <span className="ml-2 font-mono text-[10px] text-slate-400 font-bold">#{qIndex + 1}</span>
                          </div>

                          <div className="space-y-4 flex-1 text-xs">
                            <div className="flex flex-wrap gap-2.5 items-center">
                              <div>
                                <select
                                  value={q.subjectId}
                                  onChange={(e) => {
                                    const updated = [...uploadedQuestions];
                                    updated[qIndex].subjectId = e.target.value;
                                    setUploadedQuestions(updated);
                                  }}
                                  className="p-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                >
                                  {SUBJECTS.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <input
                                type="text"
                                value={q.topic}
                                onChange={(e) => {
                                  const updated = [...uploadedQuestions];
                                  updated[qIndex].topic = e.target.value;
                                  setUploadedQuestions(updated);
                                }}
                                placeholder="Topic subcategory"
                                className="p-1 px-2 text-[10px] rounded border border-slate-200 dark:border-slate-800 font-bold bg-white dark:bg-slate-950 text-slate-800 dark:text-white"
                              />

                              <select
                                value={q.difficulty}
                                onChange={(e) => {
                                  const updated = [...uploadedQuestions];
                                  updated[qIndex].difficulty = e.target.value as any;
                                  setUploadedQuestions(updated);
                                }}
                                className="p-1 text-[10px] rounded border border-slate-200 dark:border-slate-800 font-bold bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-black uppercase tracking-wider"
                              >
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                              </select>
                            </div>

                            <textarea
                              rows={2}
                              value={q.questionText}
                              onChange={(e) => {
                                const updated = [...uploadedQuestions];
                                updated[qIndex].questionText = e.target.value;
                                setUploadedQuestions(updated);
                              }}
                              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-950 text-xs"
                            />

                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-1.5 bg-slate-100/40 dark:bg-slate-950/20 p-2 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                                  <span className="font-mono text-[9px] font-black text-slate-400">{String.fromCharCode(65 + oIdx)}.</span>
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const updated = [...uploadedQuestions];
                                      const oldOpts = [...updated[qIndex].options];
                                      oldOpts[oIdx] = e.target.value;
                                      updated[qIndex].options = oldOpts;
                                      setUploadedQuestions(updated);
                                    }}
                                    className="bg-transparent border-none outline-none text-xs font-semibold w-full text-slate-800 dark:text-slate-300"
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center text-[10px] uppercase font-black tracking-wider text-slate-400 border-t border-slate-100 dark:border-slate-800/60 pt-2">
                              <span>Correct Answer text:</span>
                              <input
                                type="text"
                                value={q.correctAnswer}
                                onChange={(e) => {
                                  const updated = [...uploadedQuestions];
                                  updated[qIndex].correctAnswer = e.target.value;
                                  setUploadedQuestions(updated);
                                }}
                                className="p-1 px-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold text-slate-900 dark:text-white max-w-xs text-[10px]"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleImportSelectedQuestions}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <LucideIcon name="CheckCircle" size={14} /> Import Selected Questions to Bank ({uploadedQuestions.filter(q => selectedUploadIds[q.id]).length} items)
                    </button>
                  </div>
                </div>
              )}

              {/* DUAL SCREEN BULK LOADER & LIST SPLIT */}
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6 self-start">
                  {/* Pasted CSV Bulk Uploader */}
                  <div className={`p-6 rounded-2xl border-2 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} space-y-4 shadow-sm`}>
                    <div className="flex border-b border-slate-200 dark:border-slate-800 pb-2 text-[11px] font-black uppercase tracking-wider gap-3">
                      <button
                        onClick={() => setActiveImportTab("file")}
                        className={`pb-2 px-1 border-b-2 transition-all flex items-center gap-1 cursor-pointer ${activeImportTab === "file" ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-slate-400"}`}
                      >
                        <LucideIcon name="Upload" size={11} /> File (Excel/CSV)
                      </button>
                      <button
                        onClick={() => setActiveImportTab("paste")}
                        className={`pb-2 px-1 border-b-2 transition-all flex items-center gap-1 cursor-pointer ${activeImportTab === "paste" ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-slate-400"}`}
                      >
                        <LucideIcon name="FileText" size={11} /> Paste CSV Text
                      </button>
                    </div>

                    {/* Subject Override Assignment (Upload for specific subjects one after another) */}
                    <div className="bg-slate-100/40 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/80 space-y-1.5 shadow-xs">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                        <LucideIcon name="Settings" size={10} /> Target JSS3 Subject Destination
                      </label>
                      <select
                        value={importSubjectOverride}
                        onChange={(e) => setImportSubjectOverride(e.target.value)}
                        className="w-full px-2.5 py-2.5 rounded-lg border text-xs font-black uppercase tracking-wider outline-none bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-all focus:border-blue-500"
                      >
                        <option value="auto">🔍 Auto-detect from "Subject" column</option>
                        {SUBJECTS.map((s) => (
                          <option key={s.id} value={s.id}>
                            🎯 {s.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
                        Select a specific subject to upload custom questions for <strong>one after the other</strong>, or let the engine auto-detect.
                      </p>
                    </div>

                    {activeImportTab === "file" ? (
                      <div className="space-y-4">
                        <p className="text-[11px] text-slate-400 leading-normal font-bold">
                          Upload standard spreadsheet formats <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-950 px-1 py-0.5 rounded text-blue-600 font-extrabold uppercase">.xlsx</span>, <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-950 px-1 py-0.5 rounded text-blue-600 font-extrabold uppercase">.xls</span>, or <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-950 px-1 py-0.5 rounded text-blue-600 font-extrabold uppercase">.csv</span> containing: <span className="underline">Subject</span>, <span className="underline">Question</span>, <span className="underline">Option A</span>, <span className="underline">Option B</span>, <span className="underline">Correct Answer</span>.
                        </p>

                        {/* DRAG AND DROP ZONE */}
                        <div
                          onDragEnter={handleDrag}
                          onDragOver={handleDrag}
                          onDragLeave={handleDrag}
                          onDrop={handleDrop}
                          className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                            dragActive
                              ? "border-blue-500 bg-blue-500/5"
                              : darkMode
                              ? "border-slate-800 hover:border-slate-705 bg-slate-955/30"
                              : "border-slate-200 hover:border-blue-300 bg-slate-50"
                          }`}
                        >
                          <input
                            type="file"
                            id="excel-file-upload-input"
                            className="hidden"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileSelect}
                          />
                          <label htmlFor="excel-file-upload-input" className="cursor-pointer w-full h-full flex flex-col items-center justify-center py-4 space-y-2">
                            <div className={`p-2.5 rounded-lg ${darkMode ? "bg-slate-900 border border-slate-800" : "bg-white border border-slate-200"} flex items-center justify-center text-blue-600`}>
                              <LucideIcon name="Upload" size={20} />
                            </div>
                            <div>
                              <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Choose Spreadsheet File</span>
                              <span className="block text-[10px] text-slate-400 font-black uppercase mt-1">or drag & drop here</span>
                            </div>
                          </label>
                        </div>

                        {fileImportError && (
                          <div className="p-3 border-2 border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-black rounded-xl uppercase tracking-wider">
                            {fileImportError}
                          </div>
                        )}

                        {fileImportSuccess && (
                          <div className="p-3 border-2 border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black rounded-xl uppercase tracking-wider">
                            {fileImportSuccess}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                          <span>raw excel csv text payload</span>
                          <button
                            onClick={() => {
                              const csvDemo = `Subject,Question,Option A,Option B,Option C,Option D,Correct Answer,Explanation,Difficulty,Topic
 maths,"Solve for x: x/2 - 4 = 10",28,14,24,30,28,Multiply by 2 yields base computations.,Medium,Fractions
 english,Find antonym of DEPARTure,arrival,flight,ticket,journey,arrival,Departure means leaving. The opposite is arrival.,Easy,Antonyms`;
                              setCsvText(csvDemo);
                            }}
                            className="text-[9px] text-blue-655 dark:text-blue-400 font-extrabold uppercase tracking-wider hover:underline cursor-pointer"
                          >
                            Paste Demo Matrix
                          </button>
                        </div>

                        <textarea
                          rows={8}
                          placeholder={`Subject,Question,Option A,Option B,Option C,Option D,Correct Answer,Explanation,Difficulty,Topic
 maths,Solve for y: 2y = 10,5,10,2,4,5,Divide by 2 yields 5,Easy,Algebra`}
                          value={csvText}
                          onChange={(e) => setCsvText(e.target.value)}
                          className="w-full p-3 text-xs outline-none focus:border-blue-600 border-2 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-mono text-slate-700 dark:text-slate-300 font-bold"
                        />

                        {bulkError && <div className="p-3.5 border-2 border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-black rounded-xl uppercase tracking-wide">{bulkError}</div>}
                        {bulkSuccess && <div className="p-3.5 border-2 border-emerald-555/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black rounded-xl uppercase tracking-wide">{bulkSuccess}</div>}

                        <button
                          onClick={handleCsvImport}
                          className="w-full py-3 bg-blue-900 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all cursor-pointer"
                        >
                          Process Paste Matrix payload
                        </button>
                      </div>
                    )}
                  </div>

                  {/* AI Answer Assistant & Auto-Correction Center */}
                  <div className={`p-6 rounded-2xl border-2 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} space-y-4 shadow-sm`}>
                    <div className="flex items-center gap-2 border-b border-slate-150 dark:border-slate-800 pb-3">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <LucideIcon name="Sparkles" size={16} className={aiHealingStatus === "running" ? "animate-spin" : ""} />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">AI Answer Assistant</h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Powered by Gemini 3.5 Flash</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <p className="text-slate-500 dark:text-slate-450 leading-normal font-medium text-[11px]">
                        Spreadsheet uploads often contain mistakes, incorrect options, or mismatched labels. This tool scans your entire custom question repository and corrects them using Gemini AI.
                      </p>

                      <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-805/85 space-y-1.5 shadow-2xs">
                        <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-wider text-slate-400">
                          <span>Uploaded JSS3 Questions:</span>
                          <span className="bg-blue-50 text-blue-650 dark:bg-blue-950/50 dark:text-blue-400 px-2 py-0.5 rounded font-black text-[10px]">
                            {questions.filter(q => q.isUploaded).length} Items
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-wider text-slate-400">
                          <span>Unverified Remaining:</span>
                          <span className="bg-amber-50 text-amber-650 dark:bg-amber-950/50 dark:text-amber-400 px-2 py-0.5 rounded font-black text-[10px]">
                            {questions.filter(q => q.isUploaded && !q.aiVerified).length} Items
                          </span>
                        </div>
                      </div>

                      {aiHealingStatus === "idle" && (
                        <button
                          onClick={handleAiCorrectQuestions}
                          disabled={questions.filter(q => q.isUploaded).length === 0}
                          className={`w-full py-3 text-xs font-black uppercase tracking-wider shadow-lg rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            questions.filter(q => q.isUploaded).length === 0
                              ? "bg-slate-100 dark:bg-slate-950 text-slate-400 border border-slate-200/50 dark:border-slate-800 cursor-not-allowed shadow-none"
                              : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-550 text-white"
                          }`}
                        >
                          <LucideIcon name="Sparkles" size={13} /> {questions.filter(q => q.isUploaded && !q.aiVerified).length > 0 ? "Correct Next 30 Uploads" : "Re-Verify All Uploads"}
                        </button>
                      )}

                      {aiHealingStatus === "running" && (
                        <div className="space-y-2 p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200/50 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-400 font-bold text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping"></span>
                            <span className="text-[11px] uppercase tracking-wider">AI Auditing uploads...</span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-normal normal-case font-medium">
                            Analyzing curriculum content scientifically and replacing incorrect answers. Please wait (10-30 seconds).
                          </p>
                        </div>
                      )}

                      {aiHealingStatus === "error" && (
                        <div className="space-y-2">
                          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200/50 dark:border-rose-900/50 text-rose-600 dark:text-rose-450 text-[11px] font-bold">
                            <span className="uppercase tracking-wider font-extrabold block mb-1"> Correction Failed</span>
                            {aiHealingError}
                          </div>
                          <button
                            onClick={handleAiCorrectQuestions}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md"
                          >
                            Retry correction run
                          </button>
                        </div>
                      )}

                      {aiHealingStatus === "success" && aiHealingResults && (
                        <div className="space-y-3">
                          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/10 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400 space-y-1">
                            <div className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                              <LucideIcon name="CheckCircle" size={12} className="text-emerald-600" /> Audit Complete!
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-bold text-slate-500 pt-2 border-t border-emerald-200/40 dark:border-emerald-900/20">
                              <div>Reviewed: <span className="font-black text-slate-700 dark:text-slate-350">{aiHealingResults.analyzedCount}</span></div>
                              <div>Corrections: <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{aiHealingResults.correctionsCount}</span></div>
                            </div>
                            {aiHealingResults.totalRemaining !== undefined && aiHealingResults.totalRemaining > 0 && (
                              <div className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 border-t border-emerald-200/40 dark:border-emerald-900/20 pt-1.5 mt-1.5">
                                📊 Progress: {aiHealingResults.totalRemaining} more items left to verify.
                              </div>
                            )}
                          </div>

                          {aiHealingResults.correctionsCount > 0 ? (
                            <div className="space-y-2">
                              <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Corrections report:</div>
                              <div className="max-h-[180px] overflow-y-auto space-y-2 border border-slate-150 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-950/50 shadow-inner pr-1">
                                {aiHealingResults.corrections.map((corr, cIdx) => (
                                  <div key={cIdx} className="p-2 border border-slate-200/60 dark:border-slate-800/65 rounded-lg bg-white dark:bg-slate-950 space-y-1 text-[11px]">
                                    <div className="font-bold text-slate-600 dark:text-slate-300 leading-normal line-clamp-2">
                                      "{corr.questionText}"
                                    </div>
                                    <div className="flex flex-col text-[10px] gap-0.5 font-bold uppercase tracking-wider pt-1 border-t border-slate-100 dark:border-slate-900">
                                      <div className="text-rose-500 line-through">Old Answer: {corr.oldAnswer}</div>
                                      <div className="text-emerald-600">Corrected: {corr.newAnswer}</div>
                                    </div>
                                    {corr.explanation && (
                                      <p className="text-[9px] text-slate-400 italic font-medium leading-relaxed mt-0.5">
                                        💡 {corr.explanation}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800 rounded-xl text-center text-slate-400 font-bold uppercase text-[9px] tracking-wider leading-relaxed">
                              ✅ Outstanding performance! All uploaded questions matched scientifically correct answers.
                            </div>
                          )}

                          <button
                            onClick={() => setAiHealingStatus("idle")}
                            className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-955 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer"
                          >
                            Dismiss Report
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Custom Uploads Manager */}
                  <div className={`p-6 rounded-2xl border-2 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} space-y-4 shadow-sm`}>
                    <div className="flex items-center gap-2 border-b border-slate-150 dark:border-slate-800 pb-3">
                      <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-450">
                        <LucideIcon name="Trash2" size={15} />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Manage Custom Uploads</h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Remove custom additions by syllabus subject</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-slate-500 dark:text-slate-450 leading-normal text-[11px] font-medium">
                        If you uploaded some wrong questions or want to clean up an entire subject's custom-uploaded spreadsheet to start fresh, select them below.
                      </p>

                      {(() => {
                        const customSubjectGroups = Object.entries(
                          questions.filter(q => q.isUploaded).reduce((acc, q) => {
                            acc[q.subjectId] = (acc[q.subjectId] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([subId, count]) => {
                          const match = SUBJECTS.find(s => s.id === subId);
                          return {
                            id: subId,
                            name: match ? match.name : subId.replace(/_/g, ' '),
                            count
                          };
                        });

                        if (customSubjectGroups.length === 0) {
                          return (
                            <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl text-center text-slate-400 font-bold uppercase text-[9px] tracking-wider border border-dashed border-slate-200 dark:border-slate-800">
                              No custom uploads found in database. All questions belong to the core curriculum.
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                            {customSubjectGroups.map((group) => (
                              <div
                                key={group.id}
                                className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950/45 border border-slate-150 dark:border-slate-850 rounded-xl"
                              >
                                <div className="space-y-0.5 min-w-0 pr-2">
                                  <div className="text-[11px] font-black uppercase text-slate-705 dark:text-slate-300 truncate">
                                    {group.name}
                                  </div>
                                  <div className="text-[9px] text-slate-400 font-bold uppercase">
                                    {group.count} Custom Items
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleDeleteUploadedBySubject(group.id)}
                                  className="p-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/35 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                                >
                                  <LucideIcon name="Trash2" size={10} /> Clear
                                </button>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Question Banks lists scroll screen */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>Active Matched: {filteredQuestions.length} Questions</span>
                  </div>

                  <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                    {filteredQuestions.slice(0, 100).map((q) => (
                      <div
                        key={q.id}
                        className={`p-5 rounded-2xl border-2 ${darkMode ? "bg-slate-900 border-slate-800/80" : "bg-white border-slate-200"} space-y-3 text-xs`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex flex-wrap gap-2 uppercase font-black text-[9px] tracking-wider">
                            <span className="bg-blue-900/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-md border border-blue-500/10">
                              {q.subjectId}
                            </span>
                            <span className="bg-purple-900/10 text-purple-600 dark:text-purple-400 px-2.5 py-1 rounded-md border border-purple-500/10">
                              {q.topic}
                            </span>
                            {q.isUploaded && (
                              <span className="bg-emerald-950/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/20 font-black flex items-center gap-1.5 active-badge">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-450 animate-ping"></span>
                                PRIORITY IMPORT
                              </span>
                            )}
                          </div>

                          <div className="flex gap-3 text-[10px] font-black uppercase tracking-wider">
                            <button
                              onClick={() => setEditingQuestion(q)}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Edit Core
                            </button>
                            <button
                              onClick={() => handleDeleteQ(q.id)}
                              className="text-rose-550 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        <p className="font-black text-[15px] leading-relaxed text-blue-900 dark:text-blue-200">{q.questionText}</p>

                        <div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-500 font-bold">
                          {q.options.map((opt, i) => (
                            <div key={i} className={opt === q.correctAnswer ? "font-black text-emerald-600 dark:text-emerald-400" : ""}>
                              <span className="font-mono font-black">{String.fromCharCode(65 + i)}.</span> {opt}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {filteredQuestions.length > 50 && (
                      <div className="text-center p-4 text-[10px] text-slate-400 font-black tracking-widest uppercase italic">
                        Questions limits reached. Filter syllabus subject for deep reviews.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STUDENT CBT EXAM RESULTS PANEL */}
          {activeSegment === "results" && (() => {
            const filteredResults = results.filter((res) => {
              const matchesSearch =
                res.studentName.toLowerCase().includes(resultSearchQuery.toLowerCase()) ||
                res.studentRegId.toLowerCase().includes(resultSearchQuery.toLowerCase()) ||
                res.subjectName.toLowerCase().includes(resultSearchQuery.toLowerCase()) ||
                res.grade.toLowerCase() === resultSearchQuery.trim().toLowerCase();

              const matchesSubject = resultFilterSubject ? res.subjectId === resultFilterSubject : true;
              const matchesMode = resultFilterMode === "all" ? true : resultFilterMode === "mock" ? res.isMock === true : res.isMock === false;

              return matchesSearch && matchesSubject && matchesMode;
            });

            // Calculate metrics for filtered set
            const filteredTotal = filteredResults.length;
            const filteredPassed = filteredResults.filter(r => r.percentage >= 50).length;
            const filteredPassRate = filteredTotal > 0 ? Math.round((filteredPassed / filteredTotal) * 100) : 0;

            const handleDeleteResult = (idToDelete: string) => {
              if (confirm("Are you sure you want to delete this candidate result permanently?")) {
                const updated = results.filter(r => r.id !== idToDelete);
                setResults(updated);
                saveResultsToDB(updated);
                logActivity(user.id, user.fullName, UserRole.ADMIN, "Delete CBT Result", `Permanently removed student result record ID: ${idToDelete}.`);
              }
            };

            const formatDuration = (totalSeconds: number) => {
              const mins = Math.floor(totalSeconds / 60);
              const secs = totalSeconds % 60;
              return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
            };

            return (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                      <LucideIcon name="Award" className="text-purple-600 dark:text-purple-400" /> JSS3 CBT Candidate Results
                    </h3>
                    <p className="text-xs font-bold text-slate-400">Review, search, analyze, and manage score slips for all completed exams</p>
                  </div>

                  <button
                    onClick={handleExportResultsCSV}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    id="export-csv-btn"
                  >
                    <LucideIcon name="FileSpreadsheet" size={13} /> Export All to Excel/CSV
                  </button>
                </div>

                {/* Filter and search headers */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2 relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-405">
                      <LucideIcon name="Search" size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="Search Candidate, Registration ID, Subject name or Grade (e.g. A)..."
                      value={resultSearchQuery}
                      onChange={(e) => setResultSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border text-xs font-semibold outline-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-705 transition-all focus:border-indigo-500 shadow-xs"
                    />
                  </div>

                  <div>
                    <select
                      value={resultFilterSubject}
                      onChange={(e) => setResultFilterSubject(e.target.value)}
                      className="w-full px-3 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider outline-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-650 transition-all focus:border-indigo-500 shadow-xs"
                    >
                      <option value="">🎯 FILTER BY ALL SUBJECTS</option>
                      {SUBJECTS.map((sub) => (
                        <option key={sub.id} value={sub.id}>{sub.name.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      value={resultFilterMode}
                      onChange={(e) => setResultFilterMode(e.target.value)}
                      className="w-full px-3 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider outline-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-650 transition-all focus:border-indigo-500 shadow-xs"
                    >
                      <option value="all">📝 ALL EXAM FORMATS</option>
                      <option value="mock">⏱️ TIMED MOCK TESTS</option>
                      <option value="practice">⚡ UNTIMED PRACTICE</option>
                    </select>
                  </div>
                </div>

                {/* Micro Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200"} text-center`}>
                    <div className="text-xl font-bold font-mono text-indigo-650 dark:text-indigo-400">{filteredTotal}</div>
                    <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Filtered Records</div>
                  </div>
                  <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200"} text-center`}>
                    <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-450">{filteredPassed}</div>
                    <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Passed (Score &ge; 50%)</div>
                  </div>
                  <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200"} text-center`}>
                    <div className="text-xl font-bold font-mono text-amber-500">{filteredPassRate}%</div>
                    <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Pass Rate Percentage</div>
                  </div>
                </div>

                {filteredResults.length === 0 ? (
                  <div className={`text-center py-16 rounded-2xl border-2 border-dashed ${darkMode ? "border-slate-800" : "border-slate-250"}`}>
                    <LucideIcon name="History" size={36} className="text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-350">No results found matching conditions</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting the filters or clean the search search queries above.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-905">
                    <table className="w-full text-left text-xs">
                      <thead className={`text-[10px] uppercase tracking-wider font-semibold ${darkMode ? "bg-slate-900 text-slate-400 border-b border-slate-800" : "bg-slate-50 text-slate-500 border-b border-slate-200"}`}>
                        <tr>
                          <th className="p-3.5 border-r dark:border-slate-800">Candidate Particulars</th>
                          <th className="p-3.5 border-r dark:border-slate-800">Subject</th>
                          <th className="p-3.5 border-r dark:border-slate-800">Format</th>
                          <th className="p-3.5 border-r dark:border-slate-800">Answers Correct</th>
                          <th className="p-3.5 border-r dark:border-slate-800">Result Mark</th>
                          <th className="p-3.5 border-r dark:border-slate-800">Date Logged</th>
                          <th className="p-3.5 text-center">Action Console</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                        {filteredResults.map((res) => (
                          <tr key={res.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-900/10 transition-colors">
                            <td className="p-3.5">
                              <div className="font-bold text-slate-950 dark:text-white">{res.studentName}</div>
                              <div className="text-[10px] text-slate-400 font-mono font-semibold uppercase">{res.studentRegId}</div>
                            </td>
                            <td className="p-3.5 font-semibold text-slate-850 dark:text-slate-200">
                              {res.subjectName}
                            </td>
                            <td className="p-3.5">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${res.isMock ? "bg-rose-50 text-rose-650 dark:bg-rose-955/20 dark:text-rose-450" : "bg-blue-50 text-blue-650 dark:bg-blue-955/20 dark:text-blue-450"}`}>
                                {res.isMock ? "TIMED MOCK" : "PRACTICE"}
                              </span>
                            </td>
                            <td className="p-3.5 font-mono">
                              <span className="font-bold text-slate-900 dark:text-white">{res.correctAnswers}</span>
                              <span className="text-slate-400"> / {res.totalQuestions}</span>
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${res.percentage >= 70 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" : res.percentage >= 50 ? "bg-yellow-50 text-yellow-650 dark:bg-yellow-950/40 dark:text-yellow-405" : "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"}`}>
                                  {res.percentage}% ({res.grade})
                                </span>
                              </div>
                            </td>
                            <td className="p-3.5 font-mono text-[10px] text-slate-400">
                              {new Date(res.date).toLocaleDateString()} {new Date(res.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setSelectedResultDetail(res)}
                                  className="px-2.5 py-1.5 bg-indigo-600/10 hover:bg-slate-800/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors hover:scale-103 cursor-pointer"
                                  title="View complete answer responses corrections"
                                >
                                  <LucideIcon name="Eye" size={11} /> Review
                                </button>
                                <button
                                  onClick={() => handleDeleteResult(res.id)}
                                  className="px-2 py-1.5 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-600 dark:text-rose-400 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                                  title="Permanently remove result slip"
                                >
                                  <LucideIcon name="Trash2" size={11} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* MODAL VIEW FOR ADMINISTRATOR TO COGNITIVELY BROWSE CANDIDATE'S GRADED SHEET CORRECTIONS */}
                {selectedResultDetail && (
                  <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 no-print overflow-y-auto">
                    <div className={`p-6 sm:p-8 rounded-3xl ${darkMode ? "bg-slate-900 border-2 border-slate-800" : "bg-white"} max-w-3xl w-full max-h-[92vh] overflow-y-auto space-y-6 relative animate-zoom-in`}>
                      <button
                        onClick={() => setSelectedResultDetail(null)}
                        className="absolute right-6 top-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
                      >
                        <LucideIcon name="X" size={18} />
                      </button>

                      {/* Slip header details */}
                      <div className="border-b-2 pb-4 border-slate-100 dark:border-slate-800/80 flex items-center gap-3">
                        <img src={schoolLogo} className="w-12 h-12 object-contain rounded-full border" alt="Faith Foundation Logo" />
                        <div>
                          <h4 className="text-base font-black text-indigo-900 dark:text-white uppercase">CBT Candidate Report Card</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">FAITH FOUNDATION SCHOOLS - CORRECTIONS ENGINE</p>
                        </div>
                      </div>

                      {/* Candidate details panel */}
                      <div className="grid sm:grid-cols-2 gap-4 bg-slate-100/50 dark:bg-slate-950/20 p-4 rounded-2xl text-xs border-l-4 border-indigo-650">
                        <div className="space-y-1">
                          <div className="text-slate-400 uppercase font-black tracking-widest text-[8px]">Candidate Name</div>
                          <div className="text-sm font-black uppercase text-indigo-950 dark:text-indigo-400">{selectedResultDetail.studentName}</div>
                          <div className="font-mono text-[10px] text-slate-400">REG: {selectedResultDetail.studentRegId}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-slate-400 uppercase font-black tracking-widest text-[8px]">Exam Subject</div>
                          <div className="text-sm font-black text-slate-800 dark:text-white">{selectedResultDetail.subjectName}</div>
                          <div className="font-mono text-[10px] text-slate-400">MODE: {selectedResultDetail.isMock ? "TIMED MOCK" : "UNTIMED PRACTICE"}</div>
                        </div>
                      </div>

                      {/* Performance Indicators */}
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <div className="p-3 bg-indigo-50/20 dark:bg-slate-950/30 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{selectedResultDetail.grade}</div>
                          <div className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">Grade</div>
                        </div>
                        <div className="p-3 bg-indigo-50/20 dark:bg-slate-950/30 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="text-xl font-mono font-extrabold text-slate-800 dark:text-white">{selectedResultDetail.percentage}%</div>
                          <div className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">Score</div>
                        </div>
                        <div className="p-3 bg-indigo-50/20 dark:bg-slate-950/30 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="text-xl font-mono font-extrabold text-emerald-600">{selectedResultDetail.correctAnswers} / {selectedResultDetail.totalQuestions}</div>
                          <div className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">Correct</div>
                        </div>
                        <div className="p-3 bg-indigo-50/20 dark:bg-slate-950/30 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="text-sm font-mono font-extrabold text-slate-600 dark:text-slate-300 mt-1">{formatDuration(selectedResultDetail.timeUsed)}</div>
                          <div className="text-[9px] uppercase font-bold text-slate-400 mt-1">Duration</div>
                        </div>
                      </div>

                      {/* Question by question walkthrough list */}
                      <div className="space-y-4">
                        <h5 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                          <LucideIcon name="CheckSquare" className="text-indigo-600" /> Responses walk-through
                        </h5>

                        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                          {selectedResultDetail.corrections && selectedResultDetail.corrections.length > 0 ? (
                            selectedResultDetail.corrections.map((corr: any, idx: number) => (
                              <div key={idx} className={`p-4 rounded-xl border-2 text-xs space-y-3 ${corr.isCorrect ? "border-emerald-500/10 bg-emerald-500/5" : "border-rose-500/10 bg-rose-500/5"}`}>
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-[10px] text-slate-400 font-mono uppercase">QUESTION {idx + 1} ({corr.topic || "General"})</span>
                                  <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider ${corr.isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                                    {corr.isCorrect ? "CORRECT" : "WRONG"}
                                  </span>
                                </div>
                                <p className="font-bold text-slate-900 dark:text-blue-105 leading-relaxed">{corr.questionText}</p>
                                
                                <div className="grid sm:grid-cols-2 gap-2 text-[11px] font-medium leading-normal">
                                  <div className="p-2.5 rounded bg-amber-500/5 text-slate-700 dark:text-slate-350 flex items-center gap-2">
                                    <span className="font-bold text-amber-500 text-[10px]">SELECTED:</span>
                                    <span>{corr.studentAnswer || "No answer selected"}</span>
                                  </div>
                                  <div className="p-2.5 rounded bg-emerald-500/5 text-slate-700 dark:text-emerald-350 flex items-center gap-2">
                                    <span className="font-bold text-emerald-500 text-[10px]">CORRECT:</span>
                                    <span>{corr.correctAnswer}</span>
                                  </div>
                                </div>

                                {corr.explanation && (
                                  <div className="p-3 bg-slate-150/45 dark:bg-slate-950/40 rounded border-l-2 border-indigo-650 text-[10px] leading-relaxed font-semibold italic text-slate-500 dark:text-slate-400">
                                    <strong className="text-indigo-600 block uppercase tracking-wider text-[8px] mb-1">CBT CENTER FEEDBACK:</strong>
                                    {corr.explanation}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="p-6 text-center text-slate-402">Responses bank was omitted during submission.</div>
                          )}
                        </div>
                      </div>

                      {/* Modal footer download report slip copy option */}
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-end gap-3 text-xs font-bold uppercase tracking-wider">
                        <button
                          onClick={() => {
                            // Easily download this specific result as an elegant text file directly from detail view!
                            const result = selectedResultDetail;
                            let textRep = `FAITH FOUNDATION SCHOOLS\n`;
                            textRep += `--------------------------------------------------\n`;
                            textRep += `OFFICIAL JSS3 BECE COMPUTER BASED TESTING SLIP\n`;
                            textRep += `SESSION ID  : ${result.id}\n`;
                            textRep += `DATE EXECUTED   : ${new Date(result.date).toLocaleString()}\n`;
                            textRep += `--------------------------------------------------\n`;
                            textRep += `\nCANDIDATE STUDY PARTICULARS:\n`;
                            textRep += `Candidate Name  : ${result.studentName.toUpperCase()}\n`;
                            textRep += `Reg ID Number   : ${result.studentRegId}\n`;
                            textRep += `Syllabus Subject: ${result.subjectName}\n`;
                            textRep += `Exam Format Type: ${result.isMock ? "TIMED MOCK PRACTICE" : "UNTIMED PRACTICE LEARNING"}\n`;
                            textRep += `--------------------------------------------------\n`;
                            textRep += `\nPERFORMANCE INDEX SUMMARY:\n`;
                            textRep += `Grade Assigned  : ${result.grade}\n`;
                            textRep += `Total percentage: ${result.percentage}%\n`;
                            textRep += `Count Graded    : ${result.correctAnswers} / ${result.totalQuestions} Answered Correctly\n`;
                            textRep += `Duration Expended: ${Math.floor(result.timeUsed / 60)} minutes ${result.timeUsed % 60} seconds\n`;
                            textRep += `--------------------------------------------------\n`;
                            textRep += `\nDETAILED REVIEW CORRECTIONS:\n`;
                            if (result.corrections) {
                              result.corrections.forEach((c: any, index: number) => {
                                textRep += `\n[QUESTION ${index + 1}] Topic: ${c.topic || "General"}\n`;
                                textRep += `Question: ${c.questionText}\n`;
                                textRep += `Candidate Response: ${c.studentAnswer}\n`;
                                textRep += `Correct Response: ${c.correctAnswer}\n`;
                                textRep += `Indicator: ${c.isCorrect ? "PASSED/CORRECT" : "FAILED/WRONG"}\n`;
                                textRep += `Correction: ${c.explanation}\n`;
                              });
                            }
                            const blob = new Blob([textRep], { type: "text/plain;charset=utf-8" });
                            const link = document.createElement("a");
                            link.href = URL.createObjectURL(blob);
                            link.download = `FF_BECE_Report_${result.studentName.replace(/\s+/g, "_")}_${result.subjectId}.txt`;
                            link.click();
                          }}
                          className="px-5 py-2.5 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-white dark:text-slate-200 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                        >
                          🎫 Download Report (.txt)
                        </button>
                        <button
                          onClick={() => setSelectedResultDetail(null)}
                          className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl cursor-pointer"
                        >
                          Close Card
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* MONITOR LOGS ACTIVITY */}
          {activeSegment === "logs" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Active Student Logs Monitor</h3>
                <p className="text-xs font-bold text-slate-400">Chronological logs recording online logins, practice tests launch, and submissions</p>
              </div>

              <div className="overflow-x-auto border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className={`text-[10px] uppercase tracking-widest font-black ${darkMode ? "bg-slate-900 text-slate-450 border-b-2 border-slate-800" : "bg-slate-100 text-slate-600 border-b-2 border-slate-200"}`}>
                    <tr>
                      <th className="p-4 border-r dark:border-slate-800">User Identification</th>
                      <th className="p-4 border-r dark:border-slate-800">Role Status</th>
                      <th className="p-4 border-r dark:border-slate-800">Event Action</th>
                      <th className="p-4 border-r dark:border-slate-800">Operational Log Details</th>
                      <th className="p-4 text-right">Timestamp hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-100 dark:divide-slate-800 font-bold text-xs">
                    {activityLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-100/40 dark:hover:bg-slate-900/20">
                        <td className="p-4 font-black uppercase text-slate-900 dark:text-white text-xs">{log.userName}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded bg-slate-150 dark:bg-slate-950 text-[9px] font-black ${log.userRole === "ADMIN" ? "text-purple-600 dark:text-purple-400" : "text-blue-600 dark:text-blue-400"}`}>
                            {log.userRole}
                          </span>
                        </td>
                        <td className="p-4 font-black text-slate-950 dark:text-white text-xs">{log.action}</td>
                        <td className="p-4 text-slate-450">{log.details}</td>
                        <td className="p-4 text-right text-slate-400 font-mono text-[10px]">
                          {new Date(log.timestamp).toLocaleTimeString()} {new Date(log.timestamp).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* USER MANAGEMENT TAB */}
          {activeSegment === "users" && (() => {
            const filteredUsers = users.filter((u) => {
              const matchesSearch =
                u.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                (u.studentId && u.studentId.toLowerCase().includes(userSearchQuery.toLowerCase()));

              const matchesRole = userFilterRole === "all" ? true : u.role === userFilterRole;

              return matchesSearch && matchesRole;
            });

            return (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                      <LucideIcon name="Users" className="text-emerald-600 dark:text-emerald-400" /> JSS3 Registered Accounts
                    </h3>
                    <p className="text-xs font-bold text-slate-400">Manage student profiles, registration IDs, and educator/teacher privileges</p>
                  </div>

                  <button
                    onClick={() => {
                      setUserFormError("");
                      setNewUserForm({ fullName: "", email: "", password: "", role: UserRole.STUDENT });
                      setIsAddUserOpen(true);
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <LucideIcon name="UserPlus" size={13} /> Add New Account
                  </button>
                </div>

                {/* Filter and search headers */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3 relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-405">
                      <LucideIcon name="Search" size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="Search accounts by name, email or Student registration ID..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border text-xs font-semibold outline-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-705 transition-all focus:border-indigo-505 shadow-xs"
                    />
                  </div>

                  <div>
                    <select
                      value={userFilterRole}
                      onChange={(e) => setUserFilterRole(e.target.value)}
                      className="w-full px-3 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider outline-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-650 transition-all focus:border-indigo-500 shadow-xs"
                    >
                      <option value="all">👥 ALL ROLES</option>
                      <option value="STUDENT">👨‍🎓 STUDENTS ONLY</option>
                      <option value="ADMIN">👑 EDUCATORS / ADMINS</option>
                    </select>
                  </div>
                </div>

                {/* Micro Metrics Rows */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/65 border-slate-800" : "bg-white border-slate-200"} text-center`}>
                    <div className="text-xl font-bold font-mono text-indigo-655 dark:text-indigo-400">{users.length}</div>
                    <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Total Registered Accounts</div>
                  </div>
                  <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/65 border-slate-800" : "bg-white border-slate-200"} text-center`}>
                    <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-450">
                      {users.filter(u => u.role === UserRole.STUDENT).length}
                    </div>
                    <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">JSS3 Students</div>
                  </div>
                  <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/65 border-slate-800" : "bg-white border-slate-200"} text-center`}>
                    <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400">
                      {users.filter(u => u.role === UserRole.ADMIN).length}
                    </div>
                    <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Educators / Teachers</div>
                  </div>
                  <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/65 border-slate-800" : "bg-white border-slate-200"} text-center`}>
                    <div className="text-xl font-bold font-mono text-amber-500">{filteredUsers.length}</div>
                    <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Active Matched Accounts</div>
                  </div>
                </div>

                {filteredUsers.length === 0 ? (
                  <div className={`text-center py-16 rounded-2xl border-2 border-dashed ${darkMode ? "border-slate-800" : "border-slate-250"}`}>
                    <LucideIcon name="Users" size={36} className="text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-350">No registered accounts found</p>
                    <p className="text-xs text-slate-400 mt-1">Try searching another name, email address or adjust your active role filters.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border-2 border-slate-200 dark:border-slate-800 p-0 rounded-2xl shadow-sm bg-white dark:bg-slate-905">
                    <table className="w-full text-left text-xs">
                      <thead className={`text-[10px] uppercase tracking-wider font-semibold ${darkMode ? "bg-slate-900 text-slate-400 border-b border-slate-800" : "bg-slate-50 text-slate-500 border-b border-slate-200"}`}>
                        <tr>
                          <th className="p-3.5 border-r dark:border-slate-800">Account Owner Particulars</th>
                          <th className="p-3.5 border-r dark:border-slate-800">Registered Email</th>
                          <th className="p-3.5 border-r dark:border-slate-800">Role Status</th>
                          <th className="p-3.5 border-r dark:border-slate-800">Student ID / Privilege Label</th>
                          <th className="p-3.5 border-r dark:border-slate-800">Registration Date</th>
                          <th className="p-3.5 text-center">Action Console</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                        {filteredUsers.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-900/10 transition-colors">
                            <td className="p-3.5">
                              <div className="font-bold text-slate-950 dark:text-white flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${item.role === UserRole.ADMIN ? "bg-purple-500 animate-pulse" : "bg-indigo-500"}`} />
                                {item.fullName}
                              </div>
                            </td>
                            <td className="p-3.5 font-semibold text-slate-850 dark:text-slate-200">
                              {item.email}
                            </td>
                            <td className="p-3.5">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${item.role === UserRole.ADMIN ? "bg-purple-100 text-purple-750 dark:bg-purple-955/20 dark:text-purple-400" : "bg-indigo-55 text-indigo-650 dark:bg-indigo-955/20 dark:text-indigo-400"}`}>
                                {item.role === UserRole.ADMIN ? "💼 EDUCATOR / ADMIN" : "👨‍🎓 CANDIDATE / STUDENT"}
                              </span>
                            </td>
                            <td className="p-3.5 font-mono text-[11px] font-bold">
                              {item.studentId ? (
                                <span className="text-emerald-600 dark:text-emerald-400">{item.studentId}</span>
                              ) : (
                                <span className="text-slate-400 italic font-medium">Network Administrator</span>
                              )}
                            </td>
                            <td className="p-3.5 font-mono text-[10px] text-slate-450 font-semibold">
                              {item.registrationDate ? new Date(item.registrationDate).toLocaleDateString() : "Pre-activated"} {item.registrationDate ? new Date(item.registrationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setUserFormError("");
                                    setEditingUser(item);
                                  }}
                                  className="px-2.5 py-1.5 bg-indigo-600/10 hover:bg-slate-800/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <LucideIcon name="Edit" size={11} /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(item)}
                                  className="px-2 py-1.5 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-600 dark:text-rose-400 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                                >
                                  <LucideIcon name="Trash2" size={11} /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

          {activeSegment === "diagnostics" && (
            <DatabaseHealthCheck user={user} />
          )}
        </div>
      </main>

      {/* QUICK ADD MODAL */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-lg p-6 rounded-2xl border-2 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto`}
            >
              <div className="flex justify-between items-center pb-2 border-b-2 border-slate-100 dark:border-slate-800">
                <h3 className="font-black text-xs uppercase tracking-wider text-blue-600">Register New CBT sylabus Question</h3>
                <button onClick={() => setIsAddOpen(false)}>
                  <LucideIcon name="X" size={18} />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4 text-xs font-bold">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5">Select Subject</label>
                    <select
                      value={newQForm.subjectId}
                      onChange={(e) => setNewQForm({ ...newQForm, subjectId: e.target.value })}
                      className="w-full px-3 py-2.5 border-2 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 outline-none font-black uppercase text-[11px] tracking-wider"
                    >
                      {SUBJECTS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5">Topic subcategory</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Algebraic, Synonyms"
                      value={newQForm.topic}
                      onChange={(e) => setNewQForm({ ...newQForm, topic: e.target.value })}
                      className="w-full px-3.5 py-2 border-2 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5">Question Text</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Provide detailed context..."
                    value={newQForm.questionText}
                    onChange={(e) => setNewQForm({ ...newQForm, questionText: e.target.value })}
                    className="w-full px-3.5 py-2 border-2 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 outline-none"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5">Option A</label>
                    <input
                      type="text"
                      required
                      placeholder="Option value A"
                      value={newQForm.optA}
                      onChange={(e) => setNewQForm({ ...newQForm, optA: e.target.value })}
                      className="w-full px-3.5 py-2 border-2 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5">Option B</label>
                    <input
                      type="text"
                      required
                      placeholder="Option value B"
                      value={newQForm.optB}
                      onChange={(e) => setNewQForm({ ...newQForm, optB: e.target.value })}
                      className="w-full px-3.5 py-2 border-2 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5">Option C</label>
                    <input
                      type="text"
                      placeholder="Option value C"
                      value={newQForm.optC}
                      onChange={(e) => setNewQForm({ ...newQForm, optC: e.target.value })}
                      className="w-full px-3.5 py-2 border-2 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5">Option D</label>
                    <input
                      type="text"
                      placeholder="Option value D"
                      value={newQForm.optD}
                      onChange={(e) => setNewQForm({ ...newQForm, optD: e.target.value })}
                      className="w-full px-3.5 py-2 border-2 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5">Correct Option Text</label>
                    <input
                      type="text"
                      required
                      placeholder="Must match exactly one option"
                      value={newQForm.correctAnswer}
                      onChange={(e) => setNewQForm({ ...newQForm, correctAnswer: e.target.value })}
                      className="w-full px-3.5 py-2 border-2 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5">Difficulty level</label>
                    <select
                      value={newQForm.difficulty}
                      onChange={(e) => setNewQForm({ ...newQForm, difficulty: e.target.value as any })}
                      className="w-full px-3 py-2.5 border-2 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 outline-none font-black uppercase text-[11px] tracking-wider"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5">Revision explanation</label>
                  <textarea
                    rows={2}
                    placeholder="Enter analytical proof metrics..."
                    value={newQForm.explanation}
                    onChange={(e) => setNewQForm({ ...newQForm, explanation: e.target.value })}
                    className="w-full px-3.5 py-2 border-2 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-900 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all"
                >
                  Create CBT Question
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QUICK EDIT MODAL */}
      <AnimatePresence>
        {editingQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-lg p-6 rounded-2xl border-2 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto`}
            >
              <div className="flex justify-between items-center pb-2 border-b-2 border-slate-100 dark:border-slate-800">
                <h3 className="font-black text-xs uppercase tracking-wider text-blue-600">Edit CBT Question ID: {editingQuestion.id}</h3>
                <button onClick={() => setEditingQuestion(null)}>
                  <LucideIcon name="X" size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs font-bold">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5">Curriculum Subject</label>
                    <select
                      value={editingQuestion.subjectId}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, subjectId: e.target.value })}
                      className="w-full px-3 py-2.5 border-2 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 outline-none font-black uppercase text-[11px] tracking-wider"
                    >
                      {SUBJECTS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5">Topic Subcategory</label>
                    <input
                      type="text"
                      value={editingQuestion.topic}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, topic: e.target.value })}
                      className="w-full px-3.5 py-2 border-2 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5">Question Body text</label>
                  <textarea
                    rows={2}
                    value={editingQuestion.questionText}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })}
                    className="w-full px-3.5 py-2 border-2 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 outline-none"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {editingQuestion.options.map((opt, i) => (
                    <div key={i}>
                      <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5">Option {String.fromCharCode(65 + i)}</label>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updatedOptions = [...editingQuestion.options];
                          updatedOptions[i] = e.target.value;
                          setEditingQuestion({ ...editingQuestion, options: updatedOptions });
                        }}
                        className="w-full px-3.5 py-2 border-2 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5">Correct Option Text</label>
                    <input
                      type="text"
                      value={editingQuestion.correctAnswer}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value })}
                      className="w-full px-3.5 py-2 border-2 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5">Difficulty level</label>
                    <select
                      value={editingQuestion.difficulty}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value as any })}
                      className="w-full px-3 py-2.5 border-2 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 outline-none font-black uppercase text-[11px] tracking-wider"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5">Revision Explanation blueprint</label>
                  <textarea
                    rows={2}
                    value={editingQuestion.explanation}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                    className="w-full px-3.5 py-2 border-2 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-900 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all"
                >
                  Update Question Data
                </button>
              </form>
            </motion.div>
          </div>
        )}

      {/* CLOUD SAVING MODAL OVERLAY */}
      {isCloudSaving && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 text-center flex flex-col items-center max-w-xs space-y-4 animate-duration-150">
              <div className="relative">
                <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></span>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-955 dark:text-white">Central Sync Active</h4>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1 leading-relaxed leading-normal">{cloudSaveMessage || "Updating central CBT cloud store..."}</p>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD ACCOUNT / USER MODAL */}
      <AnimatePresence>
        {isAddUserOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-sm p-6 rounded-2xl border-2 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto`}
            >
              <div className="flex justify-between items-center pb-2 border-b-2 border-slate-100 dark:border-slate-800">
                <h3 className="font-black text-xs uppercase tracking-wider text-blue-600">Add Registered Account Profile</h3>
                <button onClick={() => setIsAddUserOpen(false)}>
                  <LucideIcon name="X" size={18} />
                </button>
              </div>

              {userFormError && (
                <div className="p-3 border border-red-500/20 bg-red-500/10 text-red-500 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <LucideIcon name="AlertTriangle" size={15} /> <span>{userFormError}</span>
                </div>
              )}

              <form onSubmit={handleAddUserSubmit} className="space-y-4 text-xs font-bold">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 font-bold">Account Role</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2.5 border-2 rounded-xl bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-800 outline-none font-black uppercase text-[11px] tracking-wider"
                  >
                    <option value={UserRole.STUDENT}>👨‍🎓 STUDENT / CANDIDATE</option>
                    <option value={UserRole.ADMIN}>👑 TEACHER / EDUCATOR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 font-bold">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Jane Doe"
                    value={newUserForm.fullName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 border-2 rounded-xl bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 font-bold">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g., user@faith.edu"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border-2 rounded-xl bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-805 outline-none text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 font-bold">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Set custom password..."
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 border-2 rounded-xl bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-805 outline-none text-[11px]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all cursor-pointer"
                >
                  Create Account Profile
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT ACCOUNT / USER MODAL */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-sm p-6 rounded-2xl border-2 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto`}
            >
              <div className="flex justify-between items-center pb-2 border-b-2 border-slate-100 dark:border-slate-800">
                <h3 className="font-black text-xs uppercase tracking-wider text-blue-600">Update Profile Details</h3>
                <button onClick={() => setEditingUser(null)}>
                  <LucideIcon name="X" size={18} />
                </button>
              </div>

              {userFormError && (
                <div className="p-3 border border-red-500/20 bg-red-500/10 text-red-500 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <LucideIcon name="AlertTriangle" size={15} /> <span>{userFormError}</span>
                </div>
              )}

              <form onSubmit={handleEditUserSubmit} className="space-y-4 text-xs font-bold">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 font-bold">Account Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2.5 border-2 rounded-xl bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-800 outline-none font-black uppercase text-[11px] tracking-wider"
                  >
                    <option value={UserRole.STUDENT}>👨‍🎓 STUDENT / CANDIDATE</option>
                    <option value={UserRole.ADMIN}>👑 TEACHER / EDUCATOR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 font-bold">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingUser.fullName}
                    onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 border-2 rounded-xl bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-805 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 font-bold">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border-2 rounded-xl bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-805 outline-none text-[11px]"
                  />
                </div>

                {editingUser.role === UserRole.STUDENT && (
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 font-bold">Registration Student ID</label>
                    <input
                      type="text"
                      value={editingUser.studentId || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, studentId: e.target.value })}
                      placeholder="Auto-assigned unless specified..."
                      className="w-full px-3.5 py-2.5 border-2 rounded-xl bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-805 outline-none text-[11px]"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all cursor-pointer"
                >
                  Save Profile Updates
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
