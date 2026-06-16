import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Question, ExamConfig, User, Subject } from "../types";
import { SUBJECTS } from "../data/subjectData";
import { toggleBookmarkInDB, isQuestionBookmarked } from "../lib/results";
import LucideIcon from "./LucideIcon";
import schoolLogo from "../assets/images/school_logo_1781627574517.jpg";

interface CbtExamViewProps {
  user: User;
  config: ExamConfig;
  allQuestions: Question[];
  darkMode: boolean;
  onCancelExam: () => void;
  onSubmitExam: (answers: Record<string, string>, timeUsedSeconds: number, tabBreaches: number, examQuestions: Question[]) => void;
}

export default function CbtExamView({
  user,
  config,
  allQuestions,
  darkMode,
  onCancelExam,
  onSubmitExam
}: CbtExamViewProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> selectedOptionText
  const [markedReview, setMarkedReview] = useState<string[]>([]); // list of questionIds
  const [timeLeft, setTimeLeft] = useState(config.duration * 60); // in seconds
  const [cheatingAttempts, setCheatingAttempts] = useState(0);
  const [showCheatingWarning, setShowCheatingWarning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculator State & Features (specific to JSS3 Math CBT)
  const [showCalculator, setShowCalculator] = useState(config.subjectId === "maths");
  const [calcInput, setCalcInput] = useState("");
  const [calcResult, setCalcResult] = useState("");

  // Draggable State for the Calculator
  const [calcPosition, setCalcPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef({ x: 0, y: 0 });

  const handleCalcInput = (char: string) => {
    setCalcInput((prev) => {
      let base = prev;
      if (calcResult !== "") {
        if (/^[0-9.(]$/.test(char) || char === "3.14159") {
          base = "";
        } else {
          base = calcResult;
        }
        setCalcResult("");
      }
      return base + char;
    });
  };

  const handleUnaryOperator = (op: "SQRT" | "SQUARE" | "PERCENT") => {
    let currentVal = 0;
    if (calcResult !== "") {
      currentVal = parseFloat(calcResult);
    } else {
      if (!calcInput) return;
      try {
        const expr = calcInput
          .replace(/×/g, "*")
          .replace(/÷/g, "/")
          .replace(/−/g, "-");
        
        if (/^[0-9+\-*/.()\s]*$/.test(expr)) {
          const res = new Function(`return (${expr})`)();
          if (res !== undefined && !isNaN(res)) {
            currentVal = res;
          } else {
            setCalcResult("Error");
            return;
          }
        } else {
          setCalcResult("Error");
          return;
        }
      } catch (e) {
        setCalcResult("Error");
        return;
      }
    }

    if (op === "SQRT") {
      if (currentVal < 0) {
        setCalcResult("Error");
      } else {
        const newVal = Math.sqrt(currentVal);
        const rounded = parseFloat(newVal.toFixed(8));
        setCalcResult(String(rounded));
        setCalcInput(`√(${currentVal})`);
      }
    } else if (op === "SQUARE") {
      const newVal = currentVal * currentVal;
      const rounded = parseFloat(newVal.toFixed(8));
      setCalcResult(String(rounded));
      setCalcInput(`(${currentVal})²`);
    } else if (op === "PERCENT") {
      const newVal = currentVal / 100;
      const rounded = parseFloat(newVal.toFixed(8));
      setCalcResult(String(rounded));
      setCalcInput(`(${currentVal})%`);
    }
  };

  const handleCalcAction = (action: "CLEAR" | "BACKSPACE" | "EVALUATE") => {
    if (action === "CLEAR") {
      setCalcInput("");
      setCalcResult("");
    } else if (action === "BACKSPACE") {
      setCalcResult("");
      setCalcInput((prev) => prev.slice(0, -1));
    } else if (action === "EVALUATE") {
      if (!calcInput) return;
      try {
        const expression = calcInput
          .replace(/×/g, "*")
          .replace(/÷/g, "/")
          .replace(/−/g, "-");

        if (/^[0-9+\-*/.()\s]*$/.test(expression)) {
          const evalResult = new Function(`return (${expression})`)();
          if (evalResult !== undefined && !isNaN(evalResult)) {
            const roundedVal = parseFloat(Number(evalResult).toFixed(8));
            setCalcResult(String(roundedVal));
          } else {
            setCalcResult("Error");
          }
        } else {
          setCalcResult("Error");
        }
      } catch (e) {
        setCalcResult("Error");
      }
    }
  };

  // Keyboard support for official CBT mathematical inputs
  useEffect(() => {
    if (config.subjectId !== "maths" || !showCalculator) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.getAttribute("contenteditable") === "true")) {
        return;
      }

      const key = e.key;
      if (/^[0-9.()]$/.test(key)) {
        e.preventDefault();
        handleCalcInput(key);
      } else if (key === "+") {
        e.preventDefault();
        handleCalcInput("+");
      } else if (key === "-") {
        e.preventDefault();
        handleCalcInput("−");
      } else if (key === "*") {
        e.preventDefault();
        handleCalcInput("×");
      } else if (key === "/") {
        e.preventDefault();
        handleCalcInput("÷");
      } else if (key === "Enter" || key === "=") {
        e.preventDefault();
        handleCalcAction("EVALUATE");
      } else if (key === "Backspace") {
        e.preventDefault();
        handleCalcAction("BACKSPACE");
      } else if (key === "Escape" || key === "c" || key === "C") {
        e.preventDefault();
        handleCalcAction("CLEAR");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [config.subjectId, showCalculator, calcInput, calcResult]);

  // Floating Drag Handlers
  const startDrag = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    
    setIsDragging(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    
    dragStartRef.current = { x: clientX, y: clientY };
    positionStartRef.current = { ...calcPosition };
  };

  useEffect(() => {
    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      
      const dx = clientX - dragStartRef.current.x;
      const dy = clientY - dragStartRef.current.y;
      
      setCalcPosition({
        x: positionStartRef.current.x + dx,
        y: positionStartRef.current.y + dy
      });
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleDragMove);
      window.addEventListener("touchend", handleDragEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging]);

  const totalTimeSeconds = config.duration * 60;
  const currentSubject = SUBJECTS.find((s) => s.id === config.subjectId);

  // Initialize and select random questions
  useEffect(() => {
    // Filter subject questions
    const subjectQ = allQuestions.filter((q) => q.subjectId === config.subjectId);
    
    // Deduplicate questions by normalized questionText to strictly guarantee no repeated questions can ever be selected
    const uniqueQMap = new Map<string, Question>();
    subjectQ.forEach((q) => {
      const normalized = q.questionText.trim().toLowerCase();
      if (!uniqueQMap.has(normalized)) {
        uniqueQMap.set(normalized, q);
      }
    });
    const uniqueSubjectQ = Array.from(uniqueQMap.values());
    
    // Random select 'questionCount' number of questions
    const shuffled = [...uniqueSubjectQ].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(config.questionCount, shuffled.length));

    // Process options shuffling for each question
    const processed = selected.map((q) => {
      const opts = [...(q.originalOptions || q.options || [])];
      // Shuffle options randomly
      const shuffledOptions = opts.sort(() => 0.5 - Math.random());
      return {
        ...q,
        options: shuffledOptions
      };
    });

    setQuestions(processed);

    // Save auto-load backups if page is refreshed
    try {
      const savedBackup = localStorage.getItem(`FF_CBT_BACKUP_${user.id}_${config.subjectId}`);
      if (savedBackup) {
        const { backupAnswers, backupIndex, backupTime, backupMarked } = JSON.parse(savedBackup);
        setAnswers(backupAnswers || {});
        setCurrentIndex(backupIndex || 0);
        setTimeLeft(backupTime || config.duration * 60);
        setMarkedReview(backupMarked || []);
      }
    } catch (e) {
      console.warn("Failed to load local backup", e);
    }
  }, [config, allQuestions, user]);

  // Handle countdown timer & auto-saving backups
  useEffect(() => {
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const nextTime = prev - 1;
        // Autosave every 5 seconds
        if (nextTime % 5 === 0 && questions.length > 0) {
          localStorage.setItem(
            `FF_CBT_BACKUP_${user.id}_${config.subjectId}`,
            JSON.stringify({
              backupAnswers: answers,
              backupIndex: currentIndex,
              backupTime: nextTime,
              backupMarked: markedReview
            })
          );
        }
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, answers, currentIndex, markedReview, questions]);

  // Anti-cheating system (Page visibility change detection)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && config.mode === "Mock") {
        setCheatingAttempts((prev) => {
          const nextVal = prev + 1;
          if (nextVal >= 3) {
            // Force auto-submit immediately
            alert("BECE Anti-Cheating Lock: Exam automatically submitted due to multiple unauthorized browser tab alterations!");
            handleAutoSubmit();
          } else {
            setShowCheatingWarning(true);
          }
          return nextVal;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [config, answers, timeLeft]);

  const handleSelectOption = (optText: string) => {
    const activeQ = questions[currentIndex];
    if (!activeQ) return;
    setAnswers((prev) => ({
      ...prev,
      [activeQ.id]: optText
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleToggleReview = () => {
    const activeQ = questions[currentIndex];
    if (!activeQ) return;
    setMarkedReview((prev) => {
      if (prev.includes(activeQ.id)) {
        return prev.filter((id) => id !== activeQ.id);
      } else {
        return [...prev, activeQ.id];
      }
    });
  };

  const toggleFullscreenMode = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        alert(`Fullscreen request failed: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleManualSubmit = () => {
    const answeredCount = Object.keys(answers).length;
    const unanswered = questions.length - answeredCount;

    let confirmMsg = `Are you sure you want to submit your ${currentSubject?.name} CBT Exam?`;
    if (unanswered > 0) {
      confirmMsg += `\nWarning: You have left ${unanswered} questions completely unanswered!`;
    }

    if (confirm(confirmMsg)) {
      executeSubmit();
    }
  };

  const handleAutoSubmit = () => {
    executeSubmit();
  };

  const executeSubmit = () => {
    // Clear local backup session
    localStorage.removeItem(`FF_CBT_BACKUP_${user.id}_${config.subjectId}`);
    
    // Compute total time spent
    const timeSpent = totalTimeSeconds - timeLeft;
    onSubmitExam(answers, Math.max(1, timeSpent), cheatingAttempts, questions);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  const activeQuestion = questions[currentIndex];
  if (!activeQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <LucideIcon name="Loader" size={32} className="animate-spin text-blue-500 mx-auto" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading Exam Database...</p>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round((Object.keys(answers).length / questions.length) * 100);

  return (
    <div
      ref={containerRef}
      className={`min-h-screen flex flex-col ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"} select-none`}
    >
      {/* HEADER EXAM STRIP */}
      <header className={`p-4 border-b ${darkMode ? "bg-slate-900 border-slate-800/60" : "bg-indigo-900 border-indigo-950 text-white"} flex flex-wrap items-center justify-between gap-4 no-print shadow-sm`}>
        <div className="flex items-center gap-3">
          <img 
            src={schoolLogo} 
            alt="Faith Foundation School Seal" 
            className="w-10 h-10 object-contain rounded-full shadow-md bg-white border border-slate-205/60" 
            referrerPolicy="no-referrer"
          />
          <div>
            <h2 className="text-sm font-bold tracking-tight uppercase flex items-center gap-2 font-serif">
              <span>FAITH FOUNDATION</span>
              <span className="font-mono text-xs text-indigo-305 dark:text-indigo-400 font-bold tracking-normal italic font-sans">CBT PORTAL</span>
            </h2>
            <div className={`flex items-center gap-2 text-[10px] font-medium tracking-wide ${darkMode ? "text-slate-400" : "text-indigo-100/90"}`}>
              <span>Candidate: {user.fullName}</span>
              <span>•</span>
              <span className={`px-1.5 py-0.2 rounded font-semibold ${config.mode === "Mock" ? "bg-rose-500/20 text-rose-300" : "bg-violet-500/20 text-violet-300"}`}>
                {config.mode === "Mock" ? "Mock Exam" : "Practice Learning"}
              </span>
            </div>
          </div>
        </div>

        {/* TIME LEFT COUNTER */}
        <div className="flex items-center gap-4">
          {config.subjectId === "maths" && (
            <button
              onClick={() => setShowCalculator((prev) => !prev)}
              className={`p-2 px-3 rounded-xl border hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                showCalculator
                  ? "bg-indigo-650 border-indigo-700 text-white"
                  : darkMode
                  ? "border-slate-800 text-slate-300"
                  : "border-indigo-700 text-white"
              }`}
              title="Toggle CBT Math Calculator"
            >
              <LucideIcon name="Calculator" size={13} />
              <span className="hidden sm:inline">Calculator</span>
            </button>
          )}

          <button
            onClick={toggleFullscreenMode}
            className={`p-2 rounded-xl border hover:bg-white/10 transition-colors cursor-pointer ${darkMode ? "border-slate-800 text-slate-300" : "border-indigo-700 text-white"}`}
            title="Toggle Focus Fullscreen"
          >
            <LucideIcon name={isFullscreen ? "Minimize" : "Maximize"} size={13} />
          </button>

          {config.mode === "Mock" && (
            <div className={`px-4 py-1 rounded-full flex items-center gap-2 border font-mono font-medium text-xs ${timeLeft <= 60 ? "bg-rose-500 text-white border-rose-500 animate-pulse" : darkMode ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/30" : "bg-indigo-850 text-white border-indigo-700/50"}`}>
              <span className={`text-[10px] uppercase font-semibold tracking-wider ${darkMode ? "text-slate-400" : "text-indigo-200"}`}>Time Remaining</span>
              <span className="text-sm font-bold tracking-wider tabular-nums">{formatTime(timeLeft)}</span>
            </div>
          )}

          <button
            onClick={handleManualSubmit}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.01] active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm uppercase tracking-wider transition-all cursor-pointer"
            id="cbt-submit-btn"
          >
            Submit Examination
          </button>
        </div>
      </header>

      {/* CORE MOCK GRID PORT */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid lg:grid-cols-4 gap-8">
        {/* LEFT COLUMN: ACTIVE EXAM TEXT AREA */}
        <div className="lg:col-span-3 space-y-6">
          <div className={`p-6 sm:p-8 rounded-3xl border ${darkMode ? "bg-slate-900 border-slate-800/80" : "bg-white border-slate-200/80"} space-y-8 shadow-sm relative min-h-[380px] flex flex-col justify-between`}>
            
            {/* Top Display Typography Header */}
            <div className="flex justify-between items-start gap-4">
              <div className="max-w-xl">
                <h3 className="text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                  <LucideIcon name={currentSubject?.icon || "BookOpen"} size={13} />
                  {currentSubject?.name} SYLLABUS
                </h3>
                <h4 className="text-lg sm:text-xl font-bold text-blue-900 dark:text-blue-200 leading-relaxed tracking-tight">
                  {activeQuestion.questionText}
                </h4>
              </div>
              <div className="text-right shrink-0">
                <span className="text-4xl sm:text-5xl font-extrabold text-slate-200/60 dark:text-slate-800 select-none leading-none tracking-tighter font-mono">
                  #{String(currentIndex + 1).padStart(2, "0")}
                </span>
              </div>
            </div>

            {/* Shuffled options select array */}
            <div className="space-y-4">
              <div className="grid gap-3">
                {activeQuestion.options.map((opt, oIdx) => {
                  const label = String.fromCharCode(65 + oIdx);
                  const isSelected = answers[activeQuestion.id] === opt;

                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelectOption(opt)}
                      className={`w-full group cursor-pointer flex items-center p-3.5 rounded-2xl border transition-all text-left ${isSelected ? "border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-sm" : "border-slate-100 hover:border-indigo-200 hover:bg-slate-50/10 dark:border-slate-800/80 dark:hover:border-slate-705 bg-transparent"}`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold font-mono text-xs shrink-0 transition-colors ${isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-650 group-hover:text-white"}`}>
                          {label}
                        </span>
                        <span className={`text-sm font-semibold ${isSelected ? "text-indigo-950 dark:text-white font-bold" : "text-slate-700 dark:text-slate-300"}`}>{opt}</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? "border-indigo-600 bg-indigo-600" : "border-slate-300 dark:border-slate-650"}`}>
                        {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PRACTICE MODE HELPER CHIP */}
            {config.mode === "Practice" && (
              <div className="pt-4 border-t border-slate-155 dark:border-slate-800/80">
                <details className="text-xs group" open>
                  <summary className="font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer select-none outline-none hover:underline flex items-center gap-1">
                    <LucideIcon name="Lightbulb" size={13} /> View Live Academic Explanation & Corrections
                  </summary>
                  <p className="mt-3 text-slate-600 dark:text-slate-350 leading-relaxed p-4 bg-indigo-50/10 dark:bg-indigo-950/25 rounded-2xl border border-slate-200/50 dark:border-slate-800 animate-fade-in text-xs">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">CORRECT ANSWER STANDARD: {activeQuestion.correctAnswer}</span>
                    {activeQuestion.explanation}
                  </p>
                </details>
              </div>
            )}            {/* BOTTOM NAV BUTTONS */}
            <div className="flex flex-wrap gap-4 justify-between items-center pt-6 border-t border-slate-100 dark:border-slate-800/60">
              <div className="flex gap-3">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 font-bold rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-all uppercase tracking-wider flex items-center gap-1 border border-transparent disabled:pointer-events-none cursor-pointer"
                  id="exam-prev-btn"
                >
                  <LucideIcon name="ChevronLeft" size={13} /> Prev
                </button>

                <button
                  onClick={handleNext}
                  disabled={currentIndex === questions.length - 1}
                  className="px-5 py-2.5 bg-indigo-650 dark:bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-sm hover:bg-indigo-700 dark:hover:bg-indigo-500 disabled:opacity-40 transition-all uppercase tracking-wider flex items-center gap-1 disabled:pointer-events-none cursor-pointer"
                  id="exam-next-btn"
                >
                  Next <LucideIcon name="ChevronRight" size={13} />
                </button>
              </div>

              <button
                onClick={handleToggleReview}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border uppercase tracking-wider cursor-pointer ${markedReview.includes(activeQuestion.id) ? "border-amber-400 bg-amber-400/10 text-amber-550" : "border-slate-205 dark:border-slate-800 text-slate-500 hover:border-amber-400 hover:text-amber-500"}`}
                id="exam-review-btn"
              >
                <LucideIcon name="Bookmark" size={13} className={markedReview.includes(activeQuestion.id) ? "fill-amber-500 text-amber-500" : ""} />
                {markedReview.includes(activeQuestion.id) ? "In Review" : "Review Later"}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: QUESTION GRID CONTROL BOARD */}
        <div className="lg:col-span-1 space-y-6 no-print">
          <div className={`p-6 rounded-3xl border ${darkMode ? "bg-slate-900 border-slate-800/80" : "bg-white border-slate-200/80"} space-y-5 shadow-sm`}>
            <div>
              <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-1">CBT Navigation Deck</h4>
              <p className="text-[11px] text-slate-400/90 font-medium">Select any index to jump directly.</p>
            </div>

            <div className="grid grid-cols-5 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = answers[q.id] !== undefined;
                const isMarked = markedReview.includes(q.id);

                let navBtnClass = "bg-slate-100/50 dark:bg-slate-950 text-slate-400 border border-slate-100 dark:border-slate-900";
                if (isAnswered) {
                  navBtnClass = "bg-emerald-500 text-white font-bold";
                }
                if (isMarked) {
                  navBtnClass = "bg-amber-400 text-white font-bold";
                }
                if (isCurrent) {
                  navBtnClass = "bg-indigo-600 text-white font-bold ring-2 ring-indigo-650 ring-offset-2 dark:ring-offset-slate-950 scale-105 shadow-sm";
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs transition-all focus:outline-none cursor-pointer ${navBtnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* COLOR LEGEND */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 space-y-2 text-[10px] uppercase font-semibold text-slate-405">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-md shrink-0" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-amber-400 rounded-md shrink-0" />
                  <span>Review Later</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shrink-0" />
                  <span>Unvisited</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-indigo-600 rounded-md shrink-0" />
                  <span>Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* CALCULATOR INFO PANEL FOR MATHS */}
            {config.subjectId === "maths" && (
              <div
                className={`p-4.5 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-sm space-y-3.5`}
              >
                <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                  <LucideIcon name="Calculator" size={15} />
                  <span className="font-bold text-[10px] uppercase tracking-wider font-serif">DESK CALCULATION PORT</span>
                </div>
                <p className={`text-[11px] leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                  A standard electronic desk calculator with roots, percentages, and keyboard support is active for this Mathematics examination.
                </p>
                <button
                  onClick={() => setShowCalculator((prev) => !prev)}
                  className={`w-full py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${
                    showCalculator
                      ? "bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20"
                      : "bg-indigo-600 text-white border-indigo-650 hover:bg-indigo-700 animate-pulse"
                  }`}
                >
                  <LucideIcon name="Calculator" size={13} />
                  <span>{showCalculator ? "Hide Math Calculator" : "Show Math Calculator"}</span>
                </button>
              </div>
            )}

          {/* PROGRESS CARD */}
          <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800/80" : "bg-indigo-50/30 border-indigo-100"} space-y-2.5 shadow-sm`}>
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>Overall Completion</span>
              <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-200/65 dark:bg-slate-950 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* DETECT CHEATING WARNING PANEL */}
      <AnimatePresence>
        {showCheatingWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[4px]">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className={`w-full max-w-sm p-6 rounded-3xl border text-center space-y-4 shadow-xl ${darkMode ? "bg-slate-900 border-red-505/20 text-white" : "bg-white border-red-500/20"}`}
            >
              <div className="mx-auto w-12 h-12 bg-red-550/10 text-red-500 flex items-center justify-center rounded-full">
                <LucideIcon name="ShieldAlert" size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-500 tracking-tight">Unauthorised Tab Navigation!</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold mt-1">
                  Breach Detected: You have altered active screens ({cheatingAttempts}/3). Continual warnings will trigger auto-submission of your JSS3 test.
                </p>
              </div>

              <button
                onClick={() => setShowCheatingWarning(false)}
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow transition-colors cursor-pointer"
              >
                Return to Active Exam Session
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PROFESSIONAL DRAGGABLE FLOATING CALCULATOR MODAL */}
      {config.subjectId === "maths" && showCalculator && (
        <div
          style={{
            transform: `translate(${calcPosition.x}px, ${calcPosition.y}px)`,
          }}
          className={`fixed bottom-24 right-4 sm:right-8 w-80 rounded-3xl border shadow-2xl z-40 select-none overflow-hidden transition-shadow ${
            isDragging ? "shadow-indigo-500/10 cursor-grabbing border-indigo-550" : "cursor-grab border-slate-250 dark:border-slate-800"
          } ${darkMode ? "bg-slate-900/95 backdrop-blur-md" : "bg-white/95 backdrop-blur-md"}`}
        >
          {/* Header */}
          <div
            onMouseDown={startDrag}
            onTouchStart={startDrag}
            className="p-3.5 bg-indigo-900 text-white flex items-center justify-between cursor-move active:cursor-move select-none"
          >
            <div className="flex items-center gap-2">
              <LucideIcon name="Calculator" size={15} className="text-indigo-200 animate-pulse" />
              <span className="font-bold text-[10px] tracking-widest uppercase font-serif">BECE Official Calculator</span>
            </div>
            <div className="flex items-center gap-1.5 no-print">
              <button
                onClick={() => setCalcPosition({ x: 0, y: 0 })}
                className="p-1 rounded-lg hover:bg-white/10 text-indigo-200 hover:text-white transition-colors cursor-pointer"
                title="Reset Position"
              >
                <LucideIcon name="RefreshCw" size={12} />
              </button>
              <button
                onClick={() => setShowCalculator(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-indigo-200 hover:text-white transition-colors cursor-pointer"
                title="Hide Calculator"
              >
                <LucideIcon name="X" size={12} />
              </button>
            </div>
          </div>

          <div className="p-4.5 space-y-3.5">
            {/* Screen */}
            <div className="bg-slate-950 dark:bg-black rounded-2xl p-3.5 text-right font-mono space-y-1 shadow-inner border border-slate-800/40 relative overflow-hidden">
              <div className="text-[10px] text-slate-400 overflow-x-auto whitespace-nowrap scrollbar-none h-4 min-h-4">
                {calcInput || "0"}
              </div>
              <div className="text-lg font-bold text-indigo-400 overflow-x-auto whitespace-nowrap scrollbar-none">
                {calcResult !== "" ? `= ${calcResult}` : calcInput !== "" ? calcInput.split(/([+\-×÷])/).pop() || "0" : "0"}
              </div>
              {/* Little label indicating Keyboard is active */}
              <div className="absolute left-2.5 bottom-1 text-[7px] text-slate-500 uppercase tracking-widest pointer-events-none font-bold">
                Keyboard Active
              </div>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold font-mono">
              {/* Row 1 */}
              <button
                onClick={() => handleCalcAction("CLEAR")}
                className="py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-450 font-bold rounded-xl active:scale-95 transition-all text-center cursor-pointer shadow-xs"
              >
                C
              </button>
              <button
                onClick={() => handleCalcInput("(")}
                className={`py-2 ${darkMode ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-100 hover:bg-slate-200"} text-slate-700 dark:text-slate-350 rounded-xl active:scale-95 transition-all text-center cursor-pointer shadow-2xs`}
              >
                (
              </button>
              <button
                onClick={() => handleCalcInput(")")}
                className={`py-2 ${darkMode ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-100 hover:bg-slate-205"} text-slate-700 dark:text-slate-350 rounded-xl active:scale-95 transition-all text-center cursor-pointer shadow-2xs`}
              >
                )
              </button>
              <button
                onClick={() => handleCalcInput("÷")}
                className="py-2 bg-indigo-650 text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all text-center cursor-pointer shadow-xs"
              >
                ÷
              </button>

              {/* Row 2 */}
              <button
                onClick={() => handleCalcInput("7")}
                className={`py-2 ${darkMode ? "bg-slate-950/60 hover:bg-slate-800" : "bg-slate-50 hover:bg-slate-200/80"} text-slate-800 dark:text-slate-200 rounded-xl active:scale-95 transition-all text-center cursor-pointer shadow-2xs`}
              >
                7
              </button>
              <button
                onClick={() => handleCalcInput("8")}
                className={`py-2 ${darkMode ? "bg-slate-950/60 hover:bg-slate-800" : "bg-slate-50 hover:bg-slate-200/80"} text-slate-800 dark:text-slate-200 rounded-xl active:scale-95 transition-all text-center cursor-pointer shadow-2xs`}
              >
                8
              </button>
              <button
                onClick={() => handleCalcInput("9")}
                className={`py-2 ${darkMode ? "bg-slate-950/60 hover:bg-slate-800" : "bg-slate-50 hover:bg-slate-200/80"} text-slate-800 dark:text-slate-200 rounded-xl active:scale-95 transition-all text-center cursor-pointer shadow-2xs`}
              >
                9
              </button>
              <button
                onClick={() => handleCalcInput("×")}
                className="py-2 bg-indigo-650 text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all text-center cursor-pointer shadow-xs"
              >
                ×
              </button>

              {/* Row 3 */}
              <button
                onClick={() => handleCalcInput("4")}
                className={`py-2 ${darkMode ? "bg-slate-950/60 hover:bg-slate-800" : "bg-slate-50 hover:bg-slate-200/80"} text-slate-800 dark:text-slate-200 rounded-xl active:scale-95 transition-all text-center cursor-pointer shadow-2xs`}
              >
                4
              </button>
              <button
                onClick={() => handleCalcInput("5")}
                className={`py-2 ${darkMode ? "bg-slate-950/60 hover:bg-slate-800" : "bg-slate-50 hover:bg-slate-200/80"} text-slate-800 dark:text-slate-200 rounded-xl active:scale-95 transition-all text-center cursor-pointer shadow-2xs`}
              >
                5
              </button>
              <button
                onClick={() => handleCalcInput("6")}
                className={`py-2 ${darkMode ? "bg-slate-950/60 hover:bg-slate-800" : "bg-slate-50 hover:bg-slate-200/80"} text-slate-800 dark:text-slate-200 rounded-xl active:scale-95 transition-all text-center cursor-pointer shadow-2xs`}
              >
                6
              </button>
              <button
                onClick={() => handleCalcInput("−")}
                className="py-2 bg-indigo-650 text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all text-center cursor-pointer shadow-xs"
              >
                −
              </button>

              {/* Row 4 */}
              <button
                onClick={() => handleCalcInput("1")}
                className={`py-2 ${darkMode ? "bg-slate-950/60 hover:bg-slate-800" : "bg-slate-50 hover:bg-slate-200/80"} text-slate-800 dark:text-slate-200 rounded-xl active:scale-95 transition-all text-center cursor-pointer shadow-2xs`}
              >
                1
              </button>
              <button
                onClick={() => handleCalcInput("2")}
                className={`py-2 ${darkMode ? "bg-slate-950/60 hover:bg-slate-800" : "bg-slate-50 hover:bg-slate-200/80"} text-slate-800 dark:text-slate-200 rounded-xl active:scale-95 transition-all text-center cursor-pointer shadow-2xs`}
              >
                2
              </button>
              <button
                onClick={() => handleCalcInput("3")}
                className={`py-2 ${darkMode ? "bg-slate-950/60 hover:bg-slate-800" : "bg-slate-50 hover:bg-slate-200/80"} text-slate-800 dark:text-slate-200 rounded-xl active:scale-95 transition-all text-center cursor-pointer shadow-2xs`}
              >
                3
              </button>
              <button
                onClick={() => handleCalcInput("+")}
                className="py-2 bg-indigo-650 text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all text-center cursor-pointer shadow-xs"
              >
                +
              </button>

              {/* Row 5 */}
              <button
                onClick={() => handleCalcInput("0")}
                className={`py-2 ${darkMode ? "bg-slate-950/60 hover:bg-slate-800" : "bg-slate-50 hover:bg-slate-200/80"} text-slate-800 dark:text-slate-200 rounded-xl active:scale-95 transition-all text-center cursor-pointer shadow-2xs`}
              >
                0
              </button>
              <button
                onClick={() => handleCalcInput(".")}
                className={`py-2 ${darkMode ? "bg-slate-950/60 hover:bg-slate-800" : "bg-slate-50 hover:bg-slate-200/80"} text-slate-800 dark:text-slate-200 rounded-xl active:scale-95 transition-all text-center cursor-pointer shadow-2xs`}
              >
                .
              </button>
              <button
                onClick={() => handleCalcAction("BACKSPACE")}
                className={`py-2 ${darkMode ? "bg-slate-850 hover:bg-slate-700" : "bg-slate-100 hover:bg-slate-200"} text-slate-700 dark:text-slate-300 rounded-xl active:scale-95 transition-all text-center cursor-pointer flex items-center justify-center shadow-xs`}
                title="Backspace"
              >
                <LucideIcon name="CornerUpLeft" size={13} />
              </button>
              <button
                onClick={() => handleCalcAction("EVALUATE")}
                className="py-2 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 active:scale-95 transition-all text-center cursor-pointer shadow-md"
              >
                =
              </button>

              {/* Row 6: Advanced Academic Ops for JSS3 Maths */}
              <button
                onClick={() => handleUnaryOperator("SQRT")}
                className="py-2 bg-indigo-705/10 hover:bg-indigo-700/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl active:scale-95 transition-all text-center cursor-pointer shadow-xs"
                title="Square Root"
              >
                √
              </button>
              <button
                onClick={() => handleUnaryOperator("SQUARE")}
                className="py-2 bg-indigo-705/10 hover:bg-indigo-700/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl active:scale-95 transition-all text-center cursor-pointer shadow-xs"
                title="Square (x²)"
              >
                x²
              </button>
              <button
                onClick={() => handleUnaryOperator("PERCENT")}
                className="py-2 bg-indigo-705/10 hover:bg-indigo-700/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl active:scale-95 transition-all text-center cursor-pointer shadow-xs"
                title="Percentage"
              >
                %
              </button>
              <button
                onClick={() => handleCalcInput("3.14159")}
                className="py-2 bg-indigo-705/10 hover:bg-indigo-700/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl active:scale-95 transition-all text-center cursor-pointer shadow-xs"
                title="Pi (3.14159)"
              >
                π
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
