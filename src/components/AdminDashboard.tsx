import React, { useState } from "react";
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
import { getResultsFromDB } from "../lib/results";
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
  const [activeSegment, setActiveSegment] = useState<"stats" | "bank" | "logs">("stats");
  const [questions, setQuestions] = useState<Question[]>(getQuestionsFromDB());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [activityLogs, setActivityLogs] = useState<any[]>(getActivityLogs());

  // Edit / Add MODALS
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
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

          let rawSub = subIdx !== -1 && row[subIdx] ? String(row[subIdx]).trim().toLowerCase() : "maths";
          let subjectId = "maths";
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

          const aVal = optA !== -1 && row[optA] !== undefined ? String(row[optA]).trim() : "";
          const bVal = optB !== -1 && row[optB] !== undefined ? String(row[optB]).trim() : "";
          const cVal = optC !== -1 && row[optC] !== undefined ? String(row[optC]).trim() : "";
          const dVal = optD !== -1 && row[optD] !== undefined ? String(row[optD]).trim() : "";
          const ansVal = ansIdx !== -1 && row[ansIdx] !== undefined ? String(row[ansIdx]).trim() : aVal;
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

  const handleImportSelectedQuestions = () => {
    const selectedList = uploadedQuestions.filter((q) => selectedUploadIds[q.id]);
    if (selectedList.length === 0) {
      alert("No questions selected. Please tick the questions you want to add.");
      return;
    }

    const currentDB = getQuestionsFromDB();
    const formattedSelected = selectedList.map((q, idx) => {
      const dbId = `${q.subjectId}_imported_${Date.now()}_${idx}`;
      return {
        ...q,
        id: dbId,
        originalOptions: [...q.options]
      };
    });

    const newMergedDB = [...formattedSelected, ...currentDB];
    saveQuestionsToDB(newMergedDB);
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
    setFileImportSuccess(`Successfully added ${formattedSelected.length} picked questions to the main curriculum question bank!`);
    setTimeout(() => setFileImportSuccess(""), 5000);
  };

  const resultsList = getResultsFromDB();
  const studentsStr = localStorage.getItem("FF_CBT_USERS") || "[]";
  const users = JSON.parse(studentsStr);
  const studentsCount = users.filter((u: any) => u.role === "STUDENT").length;

  const handleRefreshDB = () => {
    setQuestions(getQuestionsFromDB());
    setActivityLogs(getActivityLogs());
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

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQForm.questionText || !newQForm.optA || !newQForm.optB) {
      alert("Please complete the Question field and Option keys!");
      return;
    }

    const created = addQuestionToDB({
      subjectId: newQForm.subjectId,
      questionText: newQForm.questionText,
      options: [newQForm.optA, newQForm.optB, newQForm.optC, newQForm.optD].filter(Boolean),
      originalOptions: [newQForm.optA, newQForm.optB, newQForm.optC, newQForm.optD].filter(Boolean),
      correctAnswer: newQForm.correctAnswer || newQForm.optA,
      explanation: newQForm.explanation || "No explanation provided.",
      difficulty: newQForm.difficulty,
      topic: newQForm.topic || "General Study"
    });

    setIsAddOpen(false);
    handleRefreshDB();
    alert("New BECE CBT Question created successfully!");
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    const list = getQuestionsFromDB();
    const idx = list.findIndex((q) => q.id === editingQuestion.id);
    if (idx !== -1) {
      list[idx] = { ...editingQuestion, originalOptions: [...editingQuestion.options] };
      saveQuestionsToDB(list);
      logActivity(user.id, user.fullName, UserRole.ADMIN, "Edit Question", `Admin edited question: "${editingQuestion.questionText.slice(0, 40)}..."`);
      setEditingQuestion(null);
      handleRefreshDB();
      alert("Question updated successfully!");
    }
  };

  const handleDeleteQ = (id: string) => {
    if (confirm("Are you sure you want to permanently delete this question from the CBT database?")) {
      deleteQuestionFromDB(id);
      handleRefreshDB();
    }
  };

  // CSV Bulk Importer Logic
  const handleCsvImport = () => {
    if (!csvText.trim()) {
      setBulkError("CSV input area is empty. Please paste valid CSV lines.");
      return;
    }

    try {
      const rows = csvText.split("\n");
      if (rows.length < 2) {
        setBulkError("Insufficient rows. First row must serve as matching Column headers.");
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

        const subjectVal = subIdx !== -1 && cols[subIdx] ? cols[subIdx] : "maths";
        const qVal = cols[qIdx];
        const aVal = cols[optA];
        const bVal = cols[optB];
        const cVal = optC !== -1 && cols[optC] ? cols[optC] : "";
        const dVal = optD !== -1 && cols[optD] ? cols[optD] : "";
        const ansVal = ansIdx !== -1 && cols[ansIdx] ? cols[ansIdx] : aVal;
        const expVal = expIdx !== -1 && cols[expIdx] ? cols[expIdx] : "Imported verification.";
        const diffVal: "Easy" | "Medium" | "Hard" =
          diffIdx !== -1 && (cols[diffIdx] === "Easy" || cols[diffIdx] === "Hard")
            ? (cols[diffIdx] as "Easy" | "Hard")
            : "Medium";
        const topicVal = topicIdx !== -1 && cols[topicIdx] ? cols[topicIdx] : "Imported Topic";

        const opts = [aVal, bVal, cVal, dVal].filter(Boolean);

        list.unshift({
          id: `${subjectVal}_bulk_${Date.now()}_${i}`,
          subjectId: subjectVal,
          questionText: qVal,
          options: opts,
          originalOptions: [...opts],
          correctAnswer: ansVal,
          explanation: expVal,
          difficulty: diffVal,
          topic: topicVal
        });

        addedCount++;
      }

      saveQuestionsToDB(list);
      logActivity(user.id, user.fullName, UserRole.ADMIN, "Import Questions", `Bulk-imported ${addedCount} questions via pasted CSV data.`);

      setQuestions(list);
      setBulkSuccess(`Success! Completed bulk uploading of ${addedCount} questions right into the CBT database.`);
      setBulkError("");
      setCsvText("");
      setTimeout(() => setBulkSuccess(""), 4000);
    } catch (e: any) {
      setBulkError(`Upload failed: ${e.message}`);
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
              <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase leading-none">FAITH FOUNDATION</h1>
              <p className={`text-[9px] font-mono tracking-wider uppercase mt-0.5 ${darkMode ? "text-slate-400" : "text-indigo-600"}`}>ADMIN CONTROL CENTER</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
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
            onClick={() => setActiveSegment("logs")}
            className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${activeSegment === "logs" ? "border-indigo-600 text-indigo-650 dark:text-indigo-455" : "border-transparent text-slate-405 hover:text-slate-600"}`}
          >
            <LucideIcon name="Activity" size={13} /> Student Activity Logs ({activityLogs.length})
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
                {/* Pasted CSV Bulk Uploader */}
                <div className={`p-6 rounded-2xl border-2 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} lg:col-span-1 space-y-4 self-start shadow-sm`}>
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
                          className="text-[9px] text-blue-650 dark:text-blue-400 font-extrabold uppercase tracking-wider hover:underline cursor-pointer"
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
                      {bulkSuccess && <div className="p-3.5 border-2 border-emerald-505/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black rounded-xl uppercase tracking-wide">{bulkSuccess}</div>}

                      <button
                        onClick={handleCsvImport}
                        className="w-full py-3 bg-blue-900 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all cursor-pointer"
                      >
                        Process Paste Matrix payload
                      </button>
                    </div>
                  )}
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
                          <div className="flex gap-2 uppercase font-black text-[9px] tracking-wider">
                            <span className="bg-blue-900/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-md border border-blue-500/10">
                              {q.subjectId}
                            </span>
                            <span className="bg-purple-900/10 text-purple-600 dark:text-purple-400 px-2.5 py-1 rounded-md border border-purple-500/10">
                              {q.topic}
                            </span>
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
      </AnimatePresence>
    </div>
  );
}
