import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, UserRole, ExamConfig, Result, Question } from "./types";
import { getCurrentUser, loginUser, registerStudent, logoutUser, getUsersFromDB } from "./lib/auth";
import { getQuestionsFromDB } from "./data/questionDatabase";
import { saveResult, getGrade } from "./lib/results";
import { SUBJECTS } from "./data/subjectData";
import schoolLogo from "./assets/images/school_logo_1781627574517.jpg";

// Subcomponets
import Homepage from "./components/Homepage";
import StudentDashboard from "./components/StudentDashboard";
import AdminDashboard from "./components/AdminDashboard";
import CbtExamView from "./components/CbtExamView";
import CbtResultView from "./components/CbtResultView";
import LucideIcon from "./components/LucideIcon";

type ViewState = "HOME" | "AUTH" | "STUDENT_DASHBOARD" | "ADMIN_DASHBOARD" | "EXAM" | "RESULT";

export default function App() {
  const [view, setView] = useState<ViewState>("HOME");
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUser());
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("FF_CBT_DARK_MODE") === "true";
  });

  // Auth form states
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authRole, setAuthRole] = useState<UserRole>(UserRole.STUDENT);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Exam states
  const [activeExamConfig, setActiveExamConfig] = useState<ExamConfig | null>(null);
  const [activeResult, setActiveResult] = useState<Result | null>(null);

  // Initialize DB on App load
  useEffect(() => {
    getUsersFromDB(); // Seed core demo database profiles
    getQuestionsFromDB(); // Seed 960+ questions bank
  }, []);

  // Sync Dark/Light theme class with document root
  useEffect(() => {
    localStorage.setItem("FF_CBT_DARK_MODE", String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Handle routing guards depending on User sessions
  useEffect(() => {
    if (currentUser) {
      if (view === "HOME" || view === "AUTH") {
        setView(currentUser.role === UserRole.ADMIN ? "ADMIN_DASHBOARD" : "STUDENT_DASHBOARD");
      }
    } else {
      if (view !== "HOME" && view !== "AUTH") {
        setView("HOME");
      }
    }
  }, [currentUser]);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setView("HOME");
  };

  const handleNavToAuth = (mode: "login" | "register", role: "STUDENT" | "ADMIN") => {
    setAuthMode(mode);
    setAuthRole(role as UserRole);
    setAuthError("");
    setEmail("");
    setFullName("");
    setPassword("");
    setView("AUTH");
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (authMode === "login") {
      const logged = loginUser(email, password);
      if (logged) {
        setCurrentUser(logged);
        setView(logged.role === UserRole.ADMIN ? "ADMIN_DASHBOARD" : "STUDENT_DASHBOARD");
      } else {
        setAuthError("Invalid credentials! Please try again or use direct credentials shortcuts.");
      }
    } else {
      if (!fullName) {
        setAuthError("Name field is mandatory for registration!");
        return;
      }
      try {
        const registered = registerStudent(fullName, email, password);
        setCurrentUser(registered);
        setView("STUDENT_DASHBOARD");
      } catch (err: any) {
        setAuthError(err.message || "Failed to complete registration.");
      }
    }
  };

  // Direct login helpers for easy assessment
  const handleCredentialShortcut = (shortcutType: "STUDENT" | "ADMIN") => {
    if (shortcutType === "STUDENT") {
      setEmail("student@faith.edu");
      setPassword("password123");
      setAuthRole(UserRole.STUDENT);
      setAuthMode("login");
    } else {
      setEmail("admin@faith.edu");
      setPassword("admin123");
      setAuthRole(UserRole.ADMIN);
      setAuthMode("login");
    }
  };

  const handleStartExam = (config: ExamConfig) => {
    setActiveExamConfig(config);
    setView("EXAM");
  };

  const handleCancelExam = () => {
    setActiveExamConfig(null);
    setView("STUDENT_DASHBOARD");
  };

  const handleSubmitCbtExam = (
    userAnswers: Record<string, string>,
    timeUsedSeconds: number,
    tabBreaches: number,
    examQuestions?: Question[]
  ) => {
    if (!currentUser || !activeExamConfig) return;

    let activeQ: Question[] = [];
    if (examQuestions && examQuestions.length > 0) {
      activeQ = examQuestions;
    } else {
      const questionsList = getQuestionsFromDB();
      activeQ = questionsList.filter((q) => q.subjectId === activeExamConfig.subjectId).slice(0, activeExamConfig.questionCount);
    }
    
    // Evaluate correctness
    let correct = 0;
    const correctionsList = activeQ.map((q) => {
      const studentAns = userAnswers[q.id] || "No answer selected";
      const isOk = studentAns === q.correctAnswer;
      if (isOk) correct++;

      return {
        questionId: q.id,
        questionText: q.questionText,
        options: q.options || q.originalOptions,
        studentAnswer: studentAns,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        isCorrect: isOk,
        topic: q.topic
      };
    });

    const percent = Math.round((correct / activeQ.length) * 100);
    const gradeVal = getGrade(percent);
    const currentSub = SUBJECTS.find((s) => s.id === activeExamConfig.subjectId);

    const generatedResult: Result = {
      id: `res_${Date.now()}`,
      studentId: currentUser.id,
      studentName: currentUser.fullName,
      studentRegId: currentUser.studentId || "N/A",
      subjectId: activeExamConfig.subjectId,
      subjectName: currentSub?.name || "Subject Mock",
      score: correct,
      percentage: percent,
      totalQuestions: activeQ.length,
      correctAnswers: correct,
      wrongAnswers: activeQ.length - correct,
      timeUsed: timeUsedSeconds,
      duration: activeExamConfig.duration,
      grade: gradeVal,
      date: new Date().toISOString(),
      corrections: correctionsList,
      isMock: activeExamConfig.mode === "Mock"
    };

    // Commit Result to local DB
    saveResult(generatedResult);

    setActiveResult(generatedResult);
    setActiveExamConfig(null);
    setView("RESULT");
  };

  return (
    <div className={`min-h-screen ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"} transition-colors duration-300`}>
      {/* ROUTING SWITCHBOARD */}
      <AnimatePresence mode="wait">
        {/* VIEW 1: LANDING HOMEPAGE */}
        {view === "HOME" && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Homepage
              onNavToAuth={handleNavToAuth}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
            />
          </motion.div>
        )}

        {/* VIEW 2: AUTHENTICATION SCREEN */}
        {view === "AUTH" && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="min-h-screen flex items-center justify-center p-4"
          >
            <div className={`w-full max-w-sm p-8 rounded-3xl border ${darkMode ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200/80"} shadow-xl space-y-6 relative`}>
              {/* Back to Home Button */}
              <button
                onClick={() => setView("HOME")}
                className={`absolute left-6 top-6 p-2 rounded-xl border text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer ${darkMode ? "border-slate-800 bg-slate-900 hover:bg-slate-800" : "border-slate-200 bg-white hover:bg-slate-50 shadow-sm"}`}
              >
                <LucideIcon name="ArrowLeft" size={16} />
              </button>

              <div className="text-center space-y-3 pt-4">
                <img 
                  src={schoolLogo} 
                  alt="Faith Foundation School Seal" 
                  className="w-16 h-16 object-contain rounded-full shadow-md bg-white border border-slate-200/60 mx-auto" 
                  referrerPolicy="no-referrer"
                />
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">
                  {authMode === "login" ? `${authRole === UserRole.ADMIN ? "Educator" : "Student"} Login` : "Student Registration"}
                </h2>
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">
                  FAITH FOUNDATION CBT Portal
                </p>
              </div>

              {/* DEMO SHORTCUTS */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 text-center space-y-3">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest block font-mono">Quick Demo Shortcuts:</span>
                <div className="flex flex-col sm:flex-row justify-center gap-2">
                  <button
                    onClick={() => handleCredentialShortcut("STUDENT")}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold tracking-wider rounded-lg hover:border-indigo-500 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-all text-indigo-600 dark:text-indigo-400 cursor-pointer"
                  >
                    🚀 Adebayo (Student)
                  </button>
                  <button
                    onClick={() => handleCredentialShortcut("ADMIN")}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold tracking-wider rounded-lg hover:border-purple-500 hover:bg-purple-50/20 dark:hover:bg-purple-950/20 transition-all text-purple-600 dark:text-purple-400 cursor-pointer"
                  >
                    👑 Mrs. Sarah (Admin)
                  </button>
                </div>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authError && (
                  <div className="p-3 border border-red-500/20 bg-red-500/10 text-red-500 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <LucideIcon name="AlertTriangle" size={15} /> <span>{authError}</span>
                  </div>
                )}

                {authMode === "register" && (
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">Your Full Name (Candidate)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Adebayo Kolawole"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border focus:ring-1 focus:ring-indigo-500 outline-none bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">Registered Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. candidate@faith.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border focus:ring-1 focus:ring-indigo-500 outline-none bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">Secure Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border focus:ring-1 focus:ring-indigo-500 outline-none bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer animate-duration-150"
                  id="auth-submit-btn"
                >
                  {authMode === "login" ? "Verify Credentials & Sign In" : "Register Candidate Account"}
                </button>
              </form>

              {/* Toggles */}
              <div className="text-center text-xs border-t border-slate-100 dark:border-slate-800/60 pt-4">
                {authRole === UserRole.STUDENT ? (
                  authMode === "login" ? (
                    <p className="text-slate-400 font-medium text-xs">
                      New candidate to this portal?{" "}
                      <button onClick={() => setAuthMode("register")} className="text-indigo-650 dark:text-indigo-400 font-bold uppercase tracking-wide hover:underline cursor-pointer">
                        Create Account
                      </button>
                    </p>
                  ) : (
                    <p className="text-slate-400 font-medium text-xs">
                      Already registered your name?{" "}
                      <button onClick={() => setAuthMode("login")} className="text-indigo-650 dark:text-indigo-400 font-bold uppercase tracking-wide hover:underline cursor-pointer">
                        Login directly
                      </button>
                    </p>
                  )
                ) : (
                  <p className="text-slate-400 font-medium uppercase tracking-wider text-[10px] font-mono">
                    Educators must use official network privileges.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 3: STUDENT DASHBOARD */}
        {view === "STUDENT_DASHBOARD" && currentUser && (
          <motion.div
            key="student_dash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <StudentDashboard
              user={currentUser}
              onLogout={handleLogout}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              onStartExam={handleStartExam}
              onViewResultCorrections={(res) => {
                setActiveResult(res);
                setView("RESULT");
              }}
            />
          </motion.div>
        )}

        {/* VIEW 4: ADMIN DASHBOARD */}
        {view === "ADMIN_DASHBOARD" && currentUser && (
          <motion.div
            key="admin_dash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AdminDashboard
              user={currentUser}
              onLogout={handleLogout}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
            />
          </motion.div>
        )}

        {/* VIEW 5: ACTIVE CBT EXAMINATION TESTING */}
        {view === "EXAM" && currentUser && activeExamConfig && (
          <motion.div
            key="exam_taking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <CbtExamView
              user={currentUser}
              config={activeExamConfig}
              allQuestions={getQuestionsFromDB()}
              darkMode={darkMode}
              onCancelExam={handleCancelExam}
              onSubmitExam={handleSubmitCbtExam}
            />
          </motion.div>
        )}

        {/* VIEW 6: RESULT GRADED SHEET */}
        {view === "RESULT" && currentUser && activeResult && (
          <motion.div
            key="result_card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <CbtResultView
              user={currentUser}
              result={activeResult}
              darkMode={darkMode}
              onClose={() => {
                setActiveResult(null);
                setView(currentUser.role === UserRole.ADMIN ? "ADMIN_DASHBOARD" : "STUDENT_DASHBOARD");
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
