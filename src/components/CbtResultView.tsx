import React, { useState } from "react";
import { motion } from "motion/react";
import { Result, User } from "../types";
import { toggleBookmarkInDB, isQuestionBookmarked } from "../lib/results";
import LucideIcon from "./LucideIcon";
import schoolLogo from "../assets/images/school_logo_1781627574517.jpg";

interface CbtResultViewProps {
  user: User;
  result: Result;
  darkMode: boolean;
  onClose: () => void;
}

export default function CbtResultView({
  user,
  result,
  darkMode,
  onClose
}: CbtResultViewProps) {
  const [bookmarkedList, setBookmarkedList] = useState<Record<string, boolean>>({});

  const formatSeconds = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs} seconds`;
  };

  const handleToggleBookmark = (qId: string) => {
    const isBookmarkedNow = toggleBookmarkInDB(user.id, qId, result.subjectId);
    setBookmarkedList((prev) => ({
      ...prev,
      [qId]: isBookmarkedNow
    }));
  };

  const isBookmarked = (qId: string) => {
    if (bookmarkedList[qId] !== undefined) {
      return bookmarkedList[qId];
    }
    return isQuestionBookmarked(user.id, qId);
  };

  // Grade styling mapper
  const gradeStyles = {
    A: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-2 border-emerald-500/30", label: "A - Excellent (Distinction)" },
    B: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-2 border-emerald-500/30", label: "B - Very Good (Credit)" },
    C: { bg: "bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400", border: "border-2 border-yellow-500/30", label: "C - Good (Pass)" },
    D: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-2 border-amber-500/30", label: "D - Fair (Pass)" },
    F: { bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", border: "border-2 border-rose-500/30", label: "F - Fail (Retake Recommended)" }
  };

  const style = gradeStyles[result.grade] || gradeStyles.F;

  return (
    <div className={`min-h-screen ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"} py-8`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8 animate-fade-in animate-duration-300">
        
        {/* ACTION BUTTON WRAPPER */}
        <div className="flex justify-between items-center no-print">
          <button
            onClick={onClose}
            className={`px-5 py-2.5 border rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800/10 transition-colors flex items-center gap-1.5 cursor-pointer ${darkMode ? "border-slate-800 text-slate-300" : "border-slate-200 text-slate-700 bg-white shadow-sm"}`}
            id="close-receipt-btn"
          >
            <LucideIcon name="ArrowLeft" size={13} /> Return to Home
          </button>

          <button
            onClick={() => window.print()}
            className="px-6 py-2.5 bg-indigo-600 border border-indigo-700 dark:border-transparent dark:bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            id="print-receipt-btn"
          >
            <LucideIcon name="Printer" size={13} /> Print Report Slip
          </button>
        </div>

        {/* OFFICIAL SCHOOL SLIP TEMPLATE IN WEB VIEW */}
        <div className={`p-8 rounded-3xl border ${darkMode ? "bg-slate-900 border-slate-805" : "bg-white border-slate-200"} shadow-md print-card space-y-6 relative`}>
          <div className="absolute right-8 top-8 opacity-[0.03] pointer-events-none text-indigo-500 no-print">
            <LucideIcon name="Award" size={240} />
          </div>

          {/* SCHOOL LOGO BANNER HEADER */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-6 border-slate-100 dark:border-slate-800/60 gap-4">
            <div className="flex items-center gap-3">
              <img 
                src={schoolLogo} 
                alt="Faith Foundation Logo" 
                className="w-14 h-14 object-contain rounded-full shadow-md bg-white border border-slate-200/60" 
                referrerPolicy="no-referrer"
              />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-indigo-900 dark:text-white tracking-tight uppercase font-serif">FAITH FOUNDATION SCHOOLS</h1>
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">OFFICIAL BECE COMPUTER-BASED REPORT SLIP</p>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs font-mono text-slate-400 lowercase">
              <div className="uppercase">session ID: {result.id.slice(0, 14)}</div>
              <div>date: {new Date(result.date).toLocaleString()}</div>
            </div>
          </div>

          {/* CANDIDATE STUDY PARTICULARS */}
          <div className="grid sm:grid-cols-2 gap-6 bg-slate-100/50 dark:bg-slate-900/10 p-5 rounded-2xl text-xs sm:text-sm font-semibold border-l-4 border-indigo-600">
            <div className="space-y-1">
              <div className="text-slate-405 uppercase tracking-wider text-[9px] font-bold">CANDIDATE NAME</div>
              <div className="text-base font-bold text-indigo-900 dark:text-indigo-400 tracking-tight leading-tight uppercase">{user.fullName}</div>
              <div className="font-mono text-slate-400 text-xs">REG NUMBER: {result.studentRegId}</div>
            </div>

            <div className="space-y-1">
              <div className="text-slate-405 uppercase tracking-wider text-[9px] font-bold">SUBJECT ATTEMPTED</div>
              <div className="text-base font-bold text-slate-850 dark:text-white tracking-tight leading-tight">{result.subjectName}</div>
              <div className="font-mono text-slate-400 text-xs">
                PATTERN: {result.isMock ? "TIMED MOCK PRACTICE" : "UNTIMED PRACTICE LEARNING"}
              </div>
            </div>
          </div>

          {/* SUMMARY SCORE CARD */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <div className={`p-5 rounded-2xl text-center flex flex-col justify-center ${style.bg} ${style.border}`}>
              <div className={`text-4xl font-extrabold ${style.text}`}>{result.grade}</div>
              <p className="text-[9px] uppercase font-bold text-slate-400 mt-1">{style.label}</p>
            </div>

            <div className={`p-5 rounded-2xl border text-center flex flex-col justify-center ${darkMode ? "bg-slate-950/20 border-slate-800/80" : "bg-white border-slate-200/80"} shadow-xs`}>
              <div className="text-2xl font-bold font-mono text-indigo-900 dark:text-indigo-400">{result.percentage}%</div>
              <p className="text-[9px] uppercase font-bold text-slate-400 mt-1">Total Percent</p>
            </div>

            <div className={`p-5 rounded-2xl border text-center flex flex-col justify-center ${darkMode ? "bg-slate-950/20 border-slate-800/80" : "bg-white border-slate-200/80"} shadow-xs`}>
              <div className="text-2xl font-bold font-mono leading-none flex items-center justify-center gap-1">
                <span className="text-emerald-505 text-emerald-600">{result.correctAnswers}</span>
                <span className="text-slate-400 text-sm">/</span>
                <span className="text-slate-405 text-lg">{result.totalQuestions}</span>
              </div>
              <p className="text-[9px] uppercase font-bold text-slate-400 mt-2">Correct answers</p>
            </div>

            <div className={`p-5 rounded-2xl border text-center flex flex-col justify-center ${darkMode ? "bg-slate-950/20 border-slate-800/80" : "bg-white border-slate-200/80"} shadow-xs`}>
              <div className="text-xl font-bold font-mono text-slate-500 dark:text-slate-400">{formatSeconds(result.timeUsed)}</div>
              <p className="text-[9px] uppercase font-bold text-slate-400 mt-1">Duration Spun</p>
            </div>
          </div>

          {/* SIGNATURE SIGN-OFF IN PRINTS */}
          <div className="hidden print-only pt-8 grid grid-cols-2 gap-12 text-center text-xs font-semibold leading-normal">
            <div className="border-t pt-4">
              <div>Coordinator, Faith Foundation CBT Center</div>
              <div className="text-[10px] text-slate-400 italic">Signature & Date Stamp</div>
            </div>
            <div className="border-t pt-4">
              <div>Head Principal Stamp</div>
              <div className="text-[10px] text-slate-400 italic">Official School Seal</div>
            </div>
          </div>
        </div>

        {/* DETAILED REMEDIAL SOLUTIONS LISTS */}
        <div className="space-y-6">
          <div className="no-print">
            <h3 className="text-lg font-bold flex items-center gap-2 tracking-tight text-slate-900 dark:text-white">
              <LucideIcon name="CheckSquare" className="text-indigo-650 dark:text-indigo-400" /> JSS3 Correction & Explanations Desk
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Walk through step-by-step corrections to master weak topics</p>
          </div>

          <div className="space-y-5">
            {result.corrections.map((corr, idx) => {
              const bookKey = isBookmarked(corr.questionId);

              return (
                <div
                  key={corr.questionId}
                  className={`p-6 rounded-3xl border ${corr.isCorrect ? "border-emerald-500/20 bg-emerald-500/5" : "border-rose-500/20 bg-rose-500/5"} relative space-y-5 shadow-sm`}
                >
                  {/* Bookmark Button */}
                  <div className="absolute right-6 top-6 no-print">
                    <button
                      onClick={() => handleToggleBookmark(corr.questionId)}
                      className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${bookKey ? "bg-amber-500 border-amber-500 text-white" : "border-slate-200 dark:border-slate-800 text-slate-400 hover:text-amber-500"}`}
                      title={bookKey ? "Saved to practice notebook" : "Bookmark question"}
                    >
                      <LucideIcon name="Bookmark" size={13} className={bookKey ? "fill-white" : ""} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2 flex-wrap text-[9px] uppercase font-bold">
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md font-mono">
                        Question {idx + 1}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md ${corr.isCorrect ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"}`}>
                        {corr.isCorrect ? "Correct" : "Incorrect"}
                      </span>
                      <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-md">
                        Topic: {corr.topic || "General"}
                      </span>
                    </div>

                    <h4 className="text-base font-semibold text-blue-900 dark:text-blue-200 leading-relaxed pr-8">
                      {corr.questionText}
                    </h4>
                  </div>

                  {/* Options grids */}
                  <div className="grid sm:grid-cols-2 gap-3 text-xs">
                    {corr.options.map((opt, oIdx) => {
                      const isStudentSelected = opt === corr.studentAnswer;
                      const isCorrectAnswer = opt === corr.correctAnswer;

                      let borderClass = "border-slate-100 dark:border-slate-900 bg-transparent";
                      if (isStudentSelected) {
                        borderClass = "border-rose-500/30 bg-rose-500/5 text-rose-700 dark:text-rose-300 font-bold";
                      }
                      if (isCorrectAnswer) {
                        borderClass = "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 font-bold";
                      }

                      return (
                        <div key={oIdx} className={`p-3.5 rounded-xl border flex items-center gap-3 ${borderClass}`}>
                          <span className="font-mono font-bold text-[10px] bg-slate-150/50 dark:bg-slate-950 w-5.5 h-5.5 rounded-lg flex items-center justify-center text-slate-500">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="text-xs font-semibold">{opt}</span>
                          {isCorrectAnswer && <LucideIcon name="Check" className="text-emerald-600 dark:text-emerald-400 ml-auto" size={14} />}
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-4 bg-indigo-50/10 dark:bg-slate-950/20 border-l-4 border-indigo-650 rounded-r-xl text-xs leading-relaxed font-medium">
                    <span className="block font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[9px] tracking-wider mb-1.5">
                      Academic Walkthrough Correction:
                    </span>
                    {corr.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

