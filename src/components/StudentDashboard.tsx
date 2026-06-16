import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Subject, ExamConfig, Result } from "../types";
import { SUBJECTS } from "../data/subjectData";
import { getResultsFromDB, getLeaderboard, getBookmarkedQuestions, toggleBookmarkInDB, getPerformanceInsights } from "../lib/results";
import LucideIcon from "./LucideIcon";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onStartExam: (config: ExamConfig) => void;
  onViewResultCorrections: (result: Result) => void;
}

export default function StudentDashboard({
  user,
  onLogout,
  darkMode,
  setDarkMode,
  onStartExam,
  onViewResultCorrections
}: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<"exams" | "history" | "analytics" | "leaderboard" | "bookmarks">("exams");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(30);
  const [examMode, setExamMode] = useState<"Practice" | "Mock">("Mock");
  const [customDuration, setCustomDuration] = useState<number>(30); // in minutes
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [recoverySubmitted, setRecoverySubmitted] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");

  const results = getResultsFromDB().filter((r) => r.studentId === user.id);
  const leaderboard = getLeaderboard();
  const bookmarks = getBookmarkedQuestions(user.id);
  const insights = getPerformanceInsights(user.id);

  // Auto set recommended duration based on question count
  useEffect(() => {
    // 1 minute per question is the standard BECE pace
    setCustomDuration(questionCount);
  }, [questionCount]);

  const handleStartExamSubmit = () => {
    if (!selectedSubject) return;
    onStartExam({
      subjectId: selectedSubject.id,
      questionCount,
      duration: customDuration,
      mode: examMode
    });
    setSelectedSubject(null);
  };

  const handleSimulatePwaInstall = () => {
    const act = confirm("Would you like to install FAITH FOUNDATION CBT to your home screen for rapid offline launching and offline question access?");
    if (act) {
      setPwaInstalled(true);
      alert("Application installed successfully! You can now run Faith CBT offline directly from your home screen.");
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) return;
    setRecoverySubmitted(true);
    setTimeout(() => {
      setRecoverySubmitted(false);
      setShowRecoveryModal(false);
      setRecoveryEmail("");
      alert("A secure password recovery trigger has been transmitted to your registered administrator network. Please contact your coordinator to reset local hashes.");
    }, 2000);
  };

  // Process data for Recharts area progression
  const chartData = results
    .slice()
    .reverse()
    .map((res, i) => ({
      index: i + 1,
      name: res.subjectName.slice(0, 5),
      percentage: res.percentage,
      score: `${res.correctAnswers}/${res.totalQuestions}`
    }));

  return (
    <div className={`min-h-screen ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50/40 text-slate-800"}`}>
      {/* HEADER NAVBAR */}
      <header className={`sticky top-0 z-45 border-b backdrop-blur-md transition-colors ${darkMode ? "bg-slate-950/90 border-slate-800/60 text-slate-100" : "bg-white/95 border-slate-200/60 text-slate-850 shadow-xs"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-xs">
              <div className="w-5.5 h-5.5 bg-indigo-600 rounded-md transform rotate-45 flex items-center justify-center">
                <span className="text-[9px] font-black transform -rotate-45 text-white font-mono">FF</span>
              </div>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">FAITH FOUNDATION</h1>
              <p className={`text-[8px] font-bold tracking-widest uppercase ${darkMode ? "text-slate-400" : "text-indigo-600 font-mono"}`}>COMPREHENSIVE BECE CBT</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Install Button if not verified */}
            {!pwaInstalled && (
              <button
                onClick={handleSimulatePwaInstall}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${darkMode ? "border-slate-800 hover:bg-slate-800/40 text-slate-300" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs"}`}
              >
                <LucideIcon name="Download" size={13} /> Install App
              </button>
            )}

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${darkMode ? "border-slate-800 text-amber-405 hover:bg-slate-805" : "border-slate-200 text-slate-600 hover:bg-slate-100 bg-white shadow-xs"}`}
              title="Toggle Dark/Light Mode"
              id="dash-theme"
            >
              <LucideIcon name={darkMode ? "Sun" : "Moon"} size={14} />
            </button>

            <div className={`flex items-center gap-3 border-l pl-4 ${darkMode ? "border-slate-800" : "border-slate-200"}`}>
              <div className="hidden md:block text-right">
                <div className={`text-xs font-bold tracking-tight ${darkMode ? "text-indigo-400" : "text-slate-800"}`}>{user.fullName}</div>
                <div className={`text-[9px] font-medium font-mono ${darkMode ? "text-slate-400" : "text-slate-450"}`}>{user.studentId}</div>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                title="Log out"
                id="student-logout"
              >
                <LucideIcon name="LogOut" size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CORE HERO SUMMARY CARD */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950 to-indigo-900 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-indigo-950">
          <div className="space-y-3">
            <span className="px-2.5 py-1 bg-white/10 text-white border border-white/15 text-[8px] font-bold tracking-widest rounded-lg uppercase font-mono">
              BECE JSS3 PROFILE
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome back, {user.fullName}!</h2>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-indigo-100/90 font-medium">
              <span className="flex items-center gap-1.5">
                <LucideIcon name="UserCheck" size={13} className="text-indigo-400" /> REGISTERED CANDIDATE
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <LucideIcon name="Hash" size={13} className="text-indigo-400" /> REG ID: {user.studentId}
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> OFFLINE ENGINE LOADED
              </span>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="px-5 py-3 bg-white/5 rounded-2xl border border-white/10 bg-slate-900/40 text-center min-w-24">
              <div className="text-xl font-bold font-mono text-indigo-400">{results.length}</div>
              <div className="text-[9px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">Exams Done</div>
            </div>
            <div className="px-5 py-3 bg-white/5 rounded-2xl border border-white/10 bg-slate-900/40 text-center min-w-24">
              <div className="text-xl font-bold font-mono text-emerald-400">
                {results.length > 0
                  ? `${Math.round(results.reduce((acc, c) => acc + c.percentage, 0) / results.length)}%`
                  : "0%"}
              </div>
              <div className="text-[9px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">Avg Score</div>
            </div>
          </div>
        </div>

        {/* TAB HOVER CONFIG */}
        <div className="border-b border-slate-200 dark:border-slate-800 flex gap-4 overflow-x-auto pb-0.5 text-xs font-semibold tracking-wide">
          <button
            onClick={() => setActiveTab("exams")}
            className={`pb-3 px-1.5 border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${activeTab === "exams" ? "border-indigo-600 text-indigo-650 dark:text-indigo-400 font-bold" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            <LucideIcon name="BookOpen" size={14} /> Take Exam Practice
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-3 px-1.5 border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${activeTab === "history" ? "border-indigo-600 text-indigo-650 dark:text-indigo-400 font-bold" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            <LucideIcon name="History" size={14} /> Exam History ({results.length})
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`pb-3 px-1.5 border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${activeTab === "analytics" ? "border-indigo-600 text-indigo-650 dark:text-indigo-400 font-bold" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            <LucideIcon name="TrendingUp" size={14} /> Analytical Progress
          </button>
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`pb-3 px-1.5 border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${activeTab === "leaderboard" ? "border-indigo-600 text-indigo-650 dark:text-indigo-400 font-bold" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            <LucideIcon name="Award" size={14} /> Leaderboard
          </button>
          <button
            onClick={() => setActiveTab("bookmarks")}
            className={`pb-3 px-1.5 border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${activeTab === "bookmarks" ? "border-indigo-600 text-indigo-650 dark:text-indigo-400 font-bold" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            <LucideIcon name="Bookmark" size={14} /> Bookmarks ({bookmarks.length})
          </button>
        </div>

        {/* ROUTE COMPONENT RENDERS */}
        <div>
          {/* TAKE EXAMINATION TAB */}
          {activeTab === "exams" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Select Subject Standard Practice</h3>
                  <p className="text-xs text-slate-440 font-medium">Questions are loaded dynamically from the JSS3 syllabus database</p>
                </div>
                <button
                  onClick={() => setShowRecoveryModal(true)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Retrieve Password / Settings
                </button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {SUBJECTS.map((sub) => {
                  const subjectResults = results.filter((r) => r.subjectId === sub.id);
                  const highestScore = subjectResults.length > 0
                    ? Math.max(...subjectResults.map((r) => r.percentage))
                    : null;

                  return (
                    <div
                      key={sub.id}
                      className={`p-6 rounded-2xl border transition-all duration-300 hover:shadow-md ${darkMode ? "bg-slate-900/60 border-slate-800/80 hover:border-indigo-500/40" : "bg-white border-slate-200/80 hover:border-indigo-500/40"}`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                          <LucideIcon name={sub.icon} size={20} />
                        </div>
                        {highestScore !== null && (
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold ${highestScore >= 70 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" : highestScore >= 50 ? "bg-yellow-5 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-400" : "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-450"}`}>
                            High Mark: {highestScore}%
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold mb-1.5 text-slate-950 dark:text-white leading-snug tracking-tight">{sub.name}</h4>
                      <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-550"} mb-5 line-clamp-2 leading-relaxed`}>
                        {sub.description}
                      </p>

                      <button
                        onClick={() => setSelectedSubject(sub)}
                        className="w-full py-2.5 bg-indigo-650 dark:bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        Launch CBT Practice Session
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* EXAM HISTORY TAB */}
          {activeTab === "history" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Active JSS3 Practice History</h3>
                <p className="text-xs text-slate-400 font-medium">Review client score summaries and comprehensive solution banks</p>
              </div>

              {results.length === 0 ? (
                <div className={`text-center py-16 rounded-2xl border border-dashed ${darkMode ? "border-slate-800" : "border-slate-200"}`}>
                  <LucideIcon name="History" size={36} className="text-slate-400 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-350">No completed results in archive</p>
                  <p className="text-xs text-slate-400 mt-1">Start a practice session to begin recording score trends.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800/65 rounded-2xl shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className={`text-[10px] uppercase tracking-wider font-semibold ${darkMode ? "bg-slate-900 text-slate-400 border-b border-slate-800" : "bg-slate-50 text-slate-500 border-b border-slate-205"}`}>
                      <tr>
                        <th className="p-3.5 border-r dark:border-slate-800">Subject Name</th>
                        <th className="p-3.5 border-r dark:border-slate-800">CBT Format</th>
                        <th className="p-3.5 border-r dark:border-slate-800">Correct Answers</th>
                        <th className="p-3.5 border-r dark:border-slate-800">Score Percent</th>
                        <th className="p-3.5 border-r dark:border-slate-800">Grade Letter</th>
                        <th className="p-3.5 border-r dark:border-slate-800">Date Logged</th>
                        <th className="p-3.5 text-right">Action Desk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                      {results.map((res) => (
                        <tr key={res.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-900/10 transition-colors">
                          <td className="p-3.5 font-semibold text-slate-950 dark:text-white">{res.subjectName}</td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold ${res.isMock ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400" : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"}`}>
                              {res.isMock ? "Mock Test" : "Practice"}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-xs">{res.correctAnswers} / {res.totalQuestions}</td>
                          <td className="p-3.5 font-bold text-indigo-600 dark:text-indigo-400 font-mono text-sm">{res.percentage}%</td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${res.grade === "A" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" : res.grade === "B" || res.grade === "C" ? "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-405" : "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"}`}>
                              {res.grade}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-400 font-mono text-[11px]">{new Date(res.date).toLocaleDateString()}</td>
                          <td className="p-3.5 text-right">
                            <div className="flex justify-end">
                              <button
                                onClick={() => onViewResultCorrections(res)}
                                className="px-3 py-1.5 bg-indigo-600 dark:bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs tracking-wide shadow-sm transition-all cursor-pointer"
                              >
                                Corrections Desk
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
          )}

          {/* ANALYTICAL PROGRESS TAB */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Performance Statistics & Syllabus Topics</h3>
                <p className="text-xs text-slate-400 font-medium">Detailed analytics based on standard BECE cognitive domains</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Topic mastery insights */}
                <div className={`p-6 rounded-2xl border ${darkMode ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200/80"} md:col-span-1 space-y-6 shadow-sm`}>
                  <h4 className="text-xs font-bold uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-slate-905 dark:text-slate-100">
                    <LucideIcon name="Target" className="text-emerald-500" /> Syllabus Feedback
                  </h4>

                  <div className="space-y-5">
                    <div>
                      <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2.5">Strong Highlights:</div>
                      <div className="space-y-2">
                        {insights.strongTopics.map((topic, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <div className="p-0.5 bg-emerald-50 dark:bg-emerald-950/45 rounded text-emerald-600 dark:text-emerald-400">
                              <LucideIcon name="ChevronRight" size={12} />
                            </div>
                            <span className="leading-tight">{topic}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-2.5">Weakness Alerts:</div>
                      <div className="space-y-2">
                        {insights.weakTopics.map((topic, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-705 dark:text-slate-300">
                            <div className="p-0.5 bg-rose-50 dark:bg-rose-950/45 rounded text-rose-600 dark:text-rose-405">
                              <LucideIcon name="ChevronRight" size={12} />
                            </div>
                            <span className="leading-tight">{topic}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Chart */}
                <div className={`p-6 rounded-2xl border ${darkMode ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200/80"} md:col-span-2 space-y-4 shadow-sm`}>
                  <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-905 dark:text-slate-100">
                    <LucideIcon name="TrendingUp" className="text-indigo-600 dark:text-indigo-400" /> Progression Trendline
                  </h4>

                  {chartData.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl">
                      <LucideIcon name="TrendingUp" size={32} className="mb-2 text-slate-400" />
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Ready for trend analysis</p>
                      <p className="text-[11px] text-slate-400 mt-1">Complete at least one practice test to map curves.</p>
                    </div>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorPercent" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} />
                          <YAxis domain={[0, 100]} stroke="#888888" fontSize={10} tickLine={false} />
                          <Tooltip
                            contentStyle={{
                              background: darkMode ? "#0f172a" : "#ffffff",
                              borderColor: darkMode ? "#334155" : "#e2e8f0",
                              borderRadius: "12px",
                              borderWidth: "1px",
                              fontSize: "11px",
                              fontWeight: "600"
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="percentage"
                            stroke="#6366f1"
                            fillOpacity={1}
                            fill="url(#colorPercent)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className="text-center">
                    <span className="text-[9px] text-slate-400 font-mono tracking-wider uppercase">X-Axis maps chronological session sequence</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STUDENT LEADERBOARD TAB */}
          {activeTab === "leaderboard" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Senior Candidate Hall of Fame</h3>
                <p className="text-xs text-slate-405 font-medium">Current running rankings computed based on official school database scores</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Top podium spot */}
                <div className={`p-6 rounded-2xl border text-center space-y-4 ${darkMode ? "bg-slate-900/60 border-slate-800/80" : "bg-indigo-50/50 border-indigo-100"}`}>
                  <div className="mx-auto w-12 h-12 bg-amber-500 text-white flex items-center justify-center rounded-full text-lg font-bold shadow-sm border-2 border-white dark:border-slate-900">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-indigo-905 dark:text-indigo-400 tracking-tight uppercase">
                      {leaderboard[0] ? leaderboard[0].fullName : "No student"}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {leaderboard[0] ? leaderboard[0].studentIdCard : "N/A"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-t border-slate-205 dark:border-slate-800/80 pt-4 font-medium text-xs">
                    <div>
                      <div className="text-base font-bold font-mono text-indigo-650 dark:text-indigo-400">
                        {leaderboard[0] ? `${leaderboard[0].avgScore}%` : "0%"}
                      </div>
                      <div className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider">Avg Percent</div>
                    </div>
                    <div>
                      <div className="text-base font-bold font-mono text-indigo-655 dark:text-indigo-400 font-mono">
                        {leaderboard[0] ? leaderboard[0].examsTaken : 0}
                      </div>
                      <div className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider">Tests Done</div>
                    </div>
                  </div>
                </div>

                {/* Overall Listing table */}
                <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200/80"} md:col-span-2 space-y-4 shadow-sm`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[9px] pb-2">
                          <th className="pb-3">Rank</th>
                          <th className="pb-3">Full Candidate Name</th>
                          <th className="pb-3">Candidate ID</th>
                          <th className="pb-3">Avg Score</th>
                          <th className="pb-3">High Mark</th>
                          <th className="pb-3 text-right">Attempts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-805 text-slate-700 dark:text-slate-300">
                        {leaderboard.map((entry, i) => (
                          <tr key={entry.studentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                            <td className="py-3">
                              <span className={`w-5.5 h-5.5 rounded-lg flex items-center justify-center text-[10px] font-bold ${i === 0 ? "bg-amber-400 text-slate-900" : i === 1 ? "bg-slate-200 text-slate-700" : i === 2 ? "bg-amber-700 text-white" : "bg-slate-100/50 dark:bg-slate-950 text-slate-400"}`}>
                                {i + 1}
                              </span>
                            </td>
                            <td className="py-3 font-semibold text-slate-950 dark:text-white uppercase text-xs">{entry.fullName}</td>
                            <td className="py-3 font-mono text-[11px]">{entry.studentIdCard}</td>
                            <td className="py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">{entry.avgScore}%</td>
                            <td className="py-3 font-mono text-emerald-600 dark:text-emerald-400 text-xs">{entry.highestScore}%</td>
                            <td className="py-3 text-right font-mono text-xs">{entry.examsTaken}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BOOKMARKED QUESTIONS TAB */}
          {activeTab === "bookmarks" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Registered Bookmarked Revision Bank</h3>
                <p className="text-xs text-slate-400 font-medium font-sans">Review selected complex questions, option breakdowns, and detailed academic insights</p>
              </div>

              {bookmarks.length === 0 ? (
                <div className={`text-center py-16 rounded-3xl border border-dashed ${darkMode ? "border-slate-800" : "border-slate-200"}`}>
                  <LucideIcon name="Bookmark" size={40} className="text-slate-400 mx-auto mb-3" />
                  <p className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">No study bookmarks stored</p>
                  <p className="text-xs text-slate-400 mt-1">To add a question here, click "Bookmark" in your next CBT session.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {bookmarks.map((bm) => {
                     const questions = JSON.parse(localStorage.getItem("FF_CBT_QUESTIONS") || "[]");
                     const qObj = questions.find((qi: any) => qi.id === bm.questionId);
                     if (!qObj) return null;

                     return (
                       <div
                         key={bm.questionId}
                         className={`p-6 rounded-3xl border ${darkMode ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200/85"} relative space-y-4 shadow-sm`}
                       >
                         <div className="flex justify-between items-start gap-4">
                           <div className="flex flex-wrap gap-2 text-[9px] font-bold uppercase tracking-wider">
                             <span className="px-2 py-0.5 bg-indigo-50 text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-md border border-indigo-500/10 font-mono">
                               {qObj.subjectId}
                             </span>
                             <span className="px-2 py-0.5 bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 rounded-md border border-purple-500/10 font-mono">
                               {qObj.topic}
                             </span>
                           </div>
                           <button
                             onClick={() => {
                               toggleBookmarkInDB(user.id, qObj.id, qObj.subjectId);
                               setActiveTab("exams");
                               setTimeout(() => setActiveTab("bookmarks"), 10);
                             }}
                             className="px-3 py-1 text-rose-500 hover:bg-rose-500/10 rounded-xl border border-rose-500/20 text-xs font-semibold tracking-wide transition-all cursor-pointer"
                           >
                             Delete Bookmark
                           </button>
                         </div>

                         <p className="text-base font-semibold leading-relaxed text-blue-900 dark:text-blue-200">{qObj.questionText}</p>

                         <div className="grid sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                           {qObj.options.map((opt: string, oi: number) => {
                             const isCorrect = opt === qObj.correctAnswer;
                             return (
                               <div
                                 key={oi}
                                 className={`p-3 rounded-xl text-xs font-semibold leading-relaxed border ${isCorrect ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400" : "bg-transparent border-slate-100 dark:border-slate-800/60 text-slate-550 dark:text-slate-400"}`}
                               >
                                 <span className="font-bold font-mono mr-1.5">{String.fromCharCode(65 + oi)}.</span> {opt}
                               </div>
                             );
                           })}
                         </div>

                         <div className="p-4 bg-indigo-50/10 dark:bg-slate-900/30 rounded-2xl border border-indigo-500/10 text-xs leading-relaxed">
                           <span className="font-bold text-indigo-650 dark:text-indigo-400 block mb-1.5 uppercase tracking-wider text-[9px] font-mono">Correction Explanation:</span>
                           <p className="text-slate-700 dark:text-slate-300 font-medium">{qObj.explanation}</p>
                         </div>
                       </div>
                     );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="text-center py-8 text-xs text-slate-400 border-t border-slate-700/10 max-w-7xl mx-auto mt-12 no-print">
        <p>© 2026 Faith Foundation Junior Secondary School CBT Portal. Powered securely via sandboxed container databases.</p>
      </footer>
      {/* CONFID MOCKS CONFIGURATION DRAWER */}
      <AnimatePresence>
        {selectedSubject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[4px]">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className={`w-full max-w-md p-6 rounded-3xl border ${darkMode ? "bg-slate-900 border-slate-800/80 text-white" : "bg-white border-slate-200/80 text-slate-900"} shadow-xl space-y-6`}
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <LucideIcon name={selectedSubject.icon} size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-tight text-slate-950 dark:text-white">{selectedSubject.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Configure Session</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSubject(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-400 hover:text-slate-650 cursor-pointer"
                >
                  <LucideIcon name="X" size={18} />
                </button>
              </div>

              {/* Configure Counts */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-2">
                    Question Count
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[20, 30, 40, 50, 80].map((num) => (
                      <button
                        key={num}
                        onClick={() => setQuestionCount(num)}
                        className={`py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${questionCount === num ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-950 hover:bg-slate-205 dark:hover:bg-slate-900 text-slate-400"}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Practice Mode */}
                <div>
                  <label className="block text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-2">
                    Practice Mode Options
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setExamMode("Mock")}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${examMode === "Mock" ? "border-indigo-500 bg-indigo-500/5" : "border-slate-100 dark:border-slate-800 bg-transparent"}`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs mb-1 text-indigo-600 dark:text-indigo-400">
                        <LucideIcon name="Timer" size={13} /> Mock Exam
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal font-medium text-slate-440">Strict countdown. Anti-cheating lock. No answers shown until submit.</p>
                    </button>

                    <button
                      onClick={() => setExamMode("Practice")}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${examMode === "Practice" ? "border-violet-500 bg-violet-600/5" : "border-slate-100 dark:border-slate-800 bg-transparent"}`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs mb-1 text-violet-600 dark:text-violet-400">
                        <LucideIcon name="Lightbulb" size={13} /> Practice Learn
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal font-medium text-slate-440 font-medium">No timer pressure. Show corrections immediately. Ideal for studying.</p>
                    </button>
                  </div>
                </div>

                {/* Duration Config */}
                <div>
                  <div className="flex justify-between items-center text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-2">
                    <span>Session Timer</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-mono text-xs">{customDuration} Minutes</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    step="5"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[8px] text-slate-400 mt-1 uppercase font-bold font-mono">
                    <span>5m minimum</span>
                    <span>120m max</span>
                  </div>
                </div>
              </div>

              {/* Start Trigger */}
              <button
                onClick={handleStartExamSubmit}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                id="start-session-btn"
              >
                Launch Active Exam ({questionCount} questions)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PASSWORD RECOVERY MODAL */}
      <AnimatePresence>
        {showRecoveryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[4px]">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className={`w-full max-w-sm p-6 rounded-3xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-xl space-y-4`}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-indigo-600 dark:text-indigo-455">Password Recovery Panel</h3>
                <button onClick={() => setShowRecoveryModal(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer">
                  <LucideIcon name="X" size={16} />
                </button>
              </div>

              <form onSubmit={handleRecoverySubmit} className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Enter your registered school email address. We will transmit a hashing instruction directly to your Principal's dashboard to recover access.
                </p>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Student Registered Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g., student@faith.edu"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border focus:ring-1 focus:ring-indigo-500 outline-none bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <button
                  type="submit"
                  disabled={recoverySubmitted}
                  className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  {recoverySubmitted ? "Broadcasting..." : "Request Recovery Hashing"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
