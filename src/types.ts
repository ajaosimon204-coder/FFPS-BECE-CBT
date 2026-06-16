export enum UserRole {
  STUDENT = "STUDENT",
  ADMIN = "ADMIN"
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  registrationDate: string;
  studentId?: string; // e.g. FF/2026/001
}

export interface Question {
  id: string;
  subjectId: string;
  questionText: string;
  options: string[]; // Shuffled or static A, B, C, D
  originalOptions: string[]; // To keep track if we shuffle
  correctAnswer: string; // The literal text or index
  explanation: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
}

export interface Subject {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  description: string;
  category: string;
}

export interface ExamConfig {
  subjectId: string;
  questionCount: number; // 20, 30, 40, 50, 80
  duration: number; // in minutes
  mode: "Practice" | "Mock"; // Practice (untimed/with hints) or Mock (strict timer)
}

export interface ExamSession {
  id: string;
  studentId: string;
  subjectId: string;
  config: ExamConfig;
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: Record<string, string>; // questionId -> selectedOptionText
  markedForReview: string[]; // list of questionIds
  timeLeft: number; // in seconds
  isSubmitted: boolean;
  startTime: string;
  tabCheatingCount: number;
}

export interface ResultCorrection {
  questionId: string;
  questionText: string;
  options: string[];
  studentAnswer: string;
  correctAnswer: string;
  explanation: string;
  isCorrect: boolean;
  topic: string;
}

export interface Result {
  id: string;
  studentId: string;
  studentName: string;
  studentRegId: string;
  subjectId: string;
  subjectName: string;
  score: number;
  percentage: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  timeUsed: number; // in seconds
  duration: number; // original duration in minutes
  grade: "A" | "B" | "C" | "D" | "F";
  date: string;
  corrections: ResultCorrection[];
  isMock: boolean;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string; // e.g., "Login", "Started Exam", "Submitted Exam", "Add Question"
  timestamp: string;
  details: string;
}

export interface BookmarkedQuestion {
  userId: string;
  questionId: string;
  subjectId: string;
}

export interface SubjectStats {
  subjectId: string;
  subjectName: string;
  examsTaken: number;
  averageScoreUrl?: string;
  averagePercentage: number;
  strongTopics: string[];
  weakTopics: string[];
}
