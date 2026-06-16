import React, { useState } from "react";
import { motion } from "motion/react";
import { SUBJECTS } from "../data/subjectData";
import LucideIcon from "./LucideIcon";
import schoolLogo from "../assets/images/school_logo_1781627574517.jpg";

interface HomepageProps {
  onNavToAuth: (mode: "login" | "register", role: "STUDENT" | "ADMIN") => void;
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Homepage({ onNavToAuth, darkMode, setDarkMode }: HomepageProps) {
  const [contactForm, setContactForm] = useState({ name: "", email: "", msg: "" });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const stats = [
    { label: "Practice Questions", value: "960+", icon: "FileText", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40" },
    { label: "Integrated Subjects", value: "12 JSS3", icon: "BookOpen", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" },
    { label: "Active Student Scale", value: "10,000+", icon: "Users", color: "text-violet-600 bg-violet-50 dark:bg-violet-950/40" },
    { label: "BECE Distinction Rate", value: "98.4%", icon: "Award", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40" }
  ];

  const features = [
    { title: "Randomized Questions", desc: "No two students receive duplicates. Questions and option order are shuffled dynamically per session.", icon: "Shuffle" },
    { title: "Real-time Analytics", desc: "View detailed results, scores, percentage ratios, grades, and speed metrics immediately.", icon: "TrendingUp" },
    { title: "Browser Security", desc: "Built-in anti-cheating warning flags detect browser tab alterations to ensure testing integrity.", icon: "ShieldCheck" },
    { title: "Full Correction Slips", desc: "Access comprehensive question-by-question explanations with academic curriculum blueprints.", icon: "CheckSquare" },
    { title: "Offline Capabilities", desc: "Optimized local persistence enables continuous progress saving during network flickers.", icon: "WifiOff" },
    { title: "Practice & Mock Modes", desc: "Choose untimed training for deep learning or timed mocks for standard BECE speed training.", icon: "Sparkles" }
  ];

  const testimonials = [
    { quote: "Faith Foundation CBT is the reason I scored 9 Distinctions in my BECE. The Yoruba tone questions and Maths timers are exactly like the exam!", author: "Chinedu Okafor", school: "JSS 3 graduate, now SS 1" },
    { quote: "Our students can practice independent tests seamlessly. The XLSX/CSV question loader and activity monitors make teacher management a joy.", author: "Mr. Olumide Awosika", school: "JSS3 Coordinator & Class Tutor" }
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email) return;
    setContactSubmitted(true);
    setContactForm({ name: "", email: "", msg: "" });
    setTimeout(() => setContactSubmitted(false), 4000);
  };

  return (
    <div className={`min-h-screen font-sans ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"} antialiased selection:bg-indigo-550 selection:text-white`}>
      {/* HEADER NAVBAR */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b ${darkMode ? "bg-slate-950/90 border-slate-800/60" : "bg-white/90 border-slate-200/60"} transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={schoolLogo} 
              alt="Faith Foundation Logo" 
              className="w-11 h-11 object-contain rounded-full shadow-md bg-white border border-slate-200/60" 
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-base font-bold tracking-tight text-indigo-600 dark:text-indigo-400 font-sans leading-none">FAITH FOUNDATION</h1>
              <p className="text-[9px] font-medium tracking-widest text-slate-400 uppercase mt-0.5">BECE CBT PORTAL</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500 dark:text-slate-400">
            <a href="#about" className="hover:text-indigo-600 transition-colors">About</a>
            <a href="#subjects" className="hover:text-indigo-600 transition-colors">Subjects</a>
            <a href="#why-us" className="hover:text-indigo-600 transition-colors">Why CBT?</a>
            <a href="#contact" className="hover:text-indigo-600 transition-colors">Support</a>
          </nav>

          <div className="flex items-center gap-3.5">
            {/* Dark Mode toggle button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border transition-all ${darkMode ? "border-slate-800 bg-slate-900/60 text-amber-300 hover:bg-slate-800" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
              title="Toggle Dark/Light theme"
              id="theme-toggler"
            >
              <LucideIcon name={darkMode ? "Sun" : "Moon"} size={16} />
            </button>

            <button
              onClick={() => onNavToAuth("login", "STUDENT")}
              className={`px-4.5 py-2 rounded-xl text-xs font-semibold border transition-all ${darkMode ? "border-slate-800 bg-slate-900/60 text-white hover:bg-slate-800" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm"}`}
              id="nav-login-btn"
            >
              Sign In
            </button>
            <button
              onClick={() => onNavToAuth("register", "STUDENT")}
              className="px-4.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md shadow-indigo-600/10 hover:scale-[1.01]"
              id="nav-register-btn"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6 lg:col-span-7"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-medium rounded-full">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                BECE Junior WAEC Exam Practice
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-5xl font-bold tracking-tight leading-[1.125] text-slate-900 dark:text-white">
                Achieve Academic Distinction with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">Faith Foundation CBT</span>
              </h1>
              <p className={`text-base sm:text-lg ${darkMode ? "text-slate-350" : "text-slate-650"} leading-relaxed font-normal`}>
                A professional, modern Computer-Based Testing platform tailoring JSS3 students with realistic exam simulations. Over 960+ syllabus-aligned questions across 12 core subjects, complete with smart corrections and real-time grading reports.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  onClick={() => onNavToAuth("register", "STUDENT")}
                  className="px-6 py-3 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.01] active:scale-95 transition-all shadow-md shadow-indigo-600/10 flex items-center gap-2"
                  id="hero-student-register"
                >
                  Student Registration <LucideIcon name="ArrowRight" size={16} />
                </button>
                <button
                  onClick={() => onNavToAuth("login", "ADMIN")}
                  className={`px-6 py-3 rounded-xl text-xs font-semibold border transition-all ${darkMode ? "border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm"}`}
                  id="hero-admin-login"
                >
                  Teacher / Admin Portal
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-5 relative"
            >
              <div className={`p-7 rounded-2xl border ${darkMode ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200/80"} shadow-xl space-y-6 relative z-10`}>
                <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800/80">
                  <span className="text-xs font-semibold tracking-wider text-slate-400">CBT TEST UTILITY UNIT</span>
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className={`p-3.5 rounded-xl ${darkMode ? "bg-slate-950/40" : "bg-slate-50"} border border-slate-100 dark:border-slate-800/40 flex items-center gap-3.5`}>
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
                      <LucideIcon name="ShieldAlert" size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Auto-Shuffled Questions</h4>
                      <p className="text-[11px] text-slate-400">Dynamic options and numbering shuffling</p>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl ${darkMode ? "bg-slate-950/40" : "bg-slate-50"} border border-slate-100 dark:border-slate-800/40 flex items-center gap-3.5`}>
                    <div className="p-2 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-lg">
                      <LucideIcon name="Timer" size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Countdown Timers</h4>
                      <p className="text-[11px] text-slate-400">Standard BECE countdown tracking with auto-save</p>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl ${darkMode ? "bg-slate-950/40" : "bg-slate-50"} border border-slate-100 dark:border-slate-800/40 flex items-center gap-3.5`}>
                    <div className="p-2 bg-[#10b981]/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                      <LucideIcon name="CheckCircle" size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Step-by-Step Corrections</h4>
                      <p className="text-[11px] text-slate-400">Walkthrough sheets guide weak curriculums</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <p className="text-[10px] text-slate-400 font-mono">Simulates JSS3 exams for all mobile and desktop browsers</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATISTICS COMPONENT */}
      <section className={`py-12 border-y ${darkMode ? "bg-[#0c111e] border-slate-800/40" : "bg-slate-100/30 border-slate-200/50"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((st, i) => (
              <div key={i} className={`p-6 rounded-2xl border flex items-center gap-4 ${darkMode ? "bg-slate-900/40 border-slate-800/50" : "bg-white border-slate-200/60"} shadow-sm`}>
                <div className={`p-3 rounded-xl ${st.color} shrink-0`}>
                  <LucideIcon name={st.icon} size={22} />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-indigo-600 dark:text-indigo-405">{st.value}</div>
                  <div className="text-[11px] font-medium text-slate-400 mt-0.5">{st.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT FAITH FOUNDATION CBT */}
      <section id="about" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">About Faith Foundation CBT</h2>
          <div className="h-1 w-12 bg-indigo-600 mx-auto rounded-full" />
          <p className={`text-base leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-650"}`}>
            Our vision is to provide Junior Secondary School (JSS 3) students across West Africa with premier digital tools that simulates the official Basic Education Certificate Exams (BECE). We build academic confidence through systematic test replication, timed speed training, and transparent corrections.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center pt-6">
          <div className="p-8 rounded-2xl bg-gradient-to-br from-indigo-650 to-indigo-805 text-white shadow-lg space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <LucideIcon name="Sparkles" size={18} /> Comprehensive Training Platform
            </h3>
            <p className="text-indigo-100 leading-relaxed text-sm font-normal">
              Standard Junior WAEC testing conditions can trigger performance anxiety. Recreating the visual interface — down to the navigation panel, countdown timer, bookmarks, and instant scoring logs — guarantees students approach exam season with maximum confidence.
            </p>
            <div className="flex gap-4 text-xs font-semibold">
              <div className="px-3 py-1.5 bg-white/10 rounded-full border border-white/20">Realistic Interface</div>
              <div className="px-3 py-1.5 bg-white/10 rounded-full border border-white/20">960+ Syllabus-matched Questions</div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Why Computer-Based Mock Testing Matters</h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="mt-0.5 p-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                  <LucideIcon name="Check" size={12} />
                </div>
                <div className="text-xs text-slate-650 dark:text-slate-300 leading-relaxed">
                  <span className="font-semibold text-slate-900 dark:text-white">Active Revision:</span> Corrections identify weak curricular subtopics, enabling focused study before official testing dates.
                </div>
              </li>
              <li className="flex gap-3">
                <div className="mt-0.5 p-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                  <LucideIcon name="Check" size={12} />
                </div>
                <div className="text-xs text-slate-650 dark:text-slate-300 leading-relaxed">
                  <span className="font-semibold text-slate-900 dark:text-white">Accurate Speed Mechanics:</span> Auto-submissions and real-time timers build muscular pacing skills.
                </div>
              </li>
              <li className="flex gap-3">
                <div className="mt-0.5 p-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                  <LucideIcon name="Check" size={12} />
                </div>
                <div className="text-xs text-slate-650 dark:text-slate-300 leading-relaxed">
                  <span className="font-semibold text-slate-900 dark:text-white">Familiar Interface:</span> Minimizes technical screen mistakes during official government examinations.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CORE SUBJECTS GRID */}
      <section id="subjects" className={`py-16 border-y ${darkMode ? "bg-[#0c111d] border-slate-800/40" : "bg-indigo-50/20 border-slate-200/50"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">12 Integrated BECE Subjects</h2>
            <div className="h-1 bg-indigo-600 mx-auto rounded-full w-12" />
            <p className={`text-sm ${darkMode ? "text-slate-350" : "text-slate-600"}`}>
              Carefully curated questions aligned with contemporary West African syllabus modules for each subject.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SUBJECTS.map((sub, i) => (
              <div
                key={sub.id}
                className={`p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:border-indigo-500/40 ${darkMode ? "bg-slate-900/60 border-slate-800/60" : "bg-white border-slate-200/60"}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <LucideIcon name={sub.icon} size={20} />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#94a3b8] font-mono">BECE Prep</span>
                </div>
                <h3 className="text-sm font-bold text-slate-950 dark:text-slate-100 mb-1.5">{sub.name}</h3>
                <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-550"} line-clamp-3 mb-4 leading-relaxed`}>
                  {sub.description}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-full">{sub.category}</span>
                  <button
                    onClick={() => onNavToAuth("register", "STUDENT")}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    Launch <LucideIcon name="ChevronRight" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY EXAM CBT? FEATURES */}
      <section id="why-us" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Why Use Our CBT Platform</h2>
          <div className="h-1 bg-indigo-600 mx-auto rounded-full w-12" />
          <p className={`text-sm ${darkMode ? "text-slate-350" : "text-slate-600"}`}>
            Equipped with state-of-the-art academic software architecture, the Faith Foundation CBT engine represents a school-standard educational benchmark.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, i) => (
            <div
              key={i}
              className={`p-6 rounded-2xl border ${darkMode ? "bg-slate-900/30 border-slate-850/60" : "bg-white border-slate-200/60"} flex flex-col gap-4 shadow-sm`}
            >
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl self-start">
                <LucideIcon name={feat.icon} size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-950 dark:text-white mb-1.5">{feat.title}</h3>
                <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-550"} leading-relaxed`}>{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* STUDENT TESTIMONIALS */}
      <section className={`py-16 border-y ${darkMode ? "bg-[#0c111e] border-slate-800/40" : "bg-slate-100/30 border-slate-200/55"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">What Our Stakeholders Say</h2>
            <div className="h-1 bg-indigo-600 mx-auto rounded-full w-12" />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((t, idx) => (
              <div key={idx} className={`p-8 rounded-2xl border ${darkMode ? "bg-slate-900/60 border-slate-800/40" : "bg-white border-slate-200/50"} relative shadow-sm`}>
                <div className="absolute right-6 top-6 text-slate-300/10 flex justify-center items-center">
                  <LucideIcon name="Quote" size={48} />
                </div>
                <div className="space-y-4 relative z-10">
                  <p className={`text-sm italic ${darkMode ? "text-slate-300" : "text-slate-600"} leading-relaxed`}>
                    "{t.quote}"
                  </p>
                  <div>
                    <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{t.author}</h4>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">{t.school}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT / INQUIRY SECTION */}
      <section id="contact" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-12 rounded-3xl border p-8 sm:p-12 bg-white dark:bg-[#0c111d] border-slate-200 dark:border-slate-800/80 shadow-md">
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Support & Enquiries</h2>
            <p className={`text-sm leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
              Do you have inquiries about integration, question customization, school licenses, or offline database setups? Touch base with our support developers.
            </p>
            <div className="space-y-3 pt-4 text-xs font-medium text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2.5">
                <LucideIcon name="Mail" className="text-indigo-500" size={15} />
                <span>support@faithfoundation.edu</span>
              </div>
              <div className="flex items-center gap-2.5">
                <LucideIcon name="Phone" className="text-indigo-500" size={15} />
                <span>+234 (0) 803 123 4567</span>
              </div>
              <div className="flex items-center gap-2.5">
                <LucideIcon name="MapPin" className="text-indigo-500" size={15} />
                <span>Faith Foundation Schools, JSS Block, Lagos, Nigeria</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleContactSubmit} className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold border-b border-slate-100 dark:border-slate-800 pb-2 text-slate-900 dark:text-white">Send Admin Message</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Bola Shittu"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full px-3/5 py-2 text-xs rounded-xl border focus:ring-1 focus:ring-indigo-500 outline-none bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g., student-parent@gmail.com"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full px-3/5 py-2 text-xs rounded-xl border focus:ring-1 focus:ring-indigo-500 outline-none bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Inquiry Details</label>
              <textarea
                required
                rows={3}
                placeholder="How can we assist you today regarding CBT BECE practices?"
                value={contactForm.msg}
                onChange={(e) => setContactForm({ ...contactForm, msg: e.target.value })}
                className="w-full px-3/5 py-2 text-xs rounded-xl border focus:ring-1 focus:ring-indigo-500 outline-none bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-650 hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
              id="submit-contact"
            >
              Submit Response
            </button>

            {contactSubmitted && (
              <div className="text-xs text-green-500 font-semibold p-2 bg-green-50 dark:bg-green-950/20 border border-green-500/20 rounded-xl">
                Your inquiry has been successfully queued for review! An administrator will get back to your email shortly.
              </div>
            )}
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={`border-t py-12 ${darkMode ? "bg-slate-950 border-slate-900 text-slate-400" : "bg-slate-900 text-slate-300"} transition-colors`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-white">
              <img 
                src={schoolLogo} 
                alt="Faith Foundation Logo" 
                className="w-8 h-8 object-contain rounded-full shadow-sm bg-white" 
                referrerPolicy="no-referrer"
              />
              <span className="font-extrabold tracking-tight">FAITH FOUNDATION</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Providing premier academic computer-based testing preparation systems matching standard WAEC curriculum requirements.
            </p>
          </div>
          <div className="space-y-3 ms-0 md:ms-8">
            <h4 className="text-white text-xs uppercase font-extrabold tracking-wider">Resources</h4>
            <ul className="space-y-1.5 text-xs text-slate-405">
              <li><a href="#about" className="hover:text-indigo-400 transition-colors">About JSS3 Prep</a></li>
              <li><a href="#subjects" className="hover:text-indigo-400 transition-colors">Available Exam Subjects</a></li>
              <li><a href="#why-us" className="hover:text-indigo-400 transition-colors">CBT Platform Blueprint</a></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-white text-xs uppercase font-extrabold tracking-wider">Security and Compliance</h4>
            <ul className="space-y-1.5 text-xs text-slate-405">
              <li>Dual Role authentication</li>
              <li>Encrypted exam progress saving</li>
              <li>Tab cheating telemetry logging</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-slate-800/80 text-center text-[10px] text-slate-500">
          <p>© 2026 Faith Foundation Junior Secondary School CBT Examination Portal. All Rights Reserved. Built for JSS 3 Academic Distinction.</p>
        </div>
      </footer>
    </div>
  );
}
