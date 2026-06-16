import { Result, Question, BookmarkedQuestion } from "../types";
import { logActivity } from "../data/questionDatabase";

const DEFAULT_MOCK_RESULTS: Result[] = [
  {
    id: "res_001",
    studentId: "stud_001",
    studentName: "Adebayo Kolawole",
    studentRegId: "FF/JSS3/102",
    subjectId: "maths",
    subjectName: "Mathematics",
    score: 24,
    percentage: 80,
    totalQuestions: 30,
    correctAnswers: 24,
    wrongAnswers: 6,
    timeUsed: 1200,
    duration: 30,
    grade: "A",
    date: "2026-06-10T14:30:00Z",
    isMock: true,
    corrections: []
  },
  {
    id: "res_002",
    studentId: "stud_001",
    studentName: "Adebayo Kolawole",
    studentRegId: "FF/JSS3/102",
    subjectId: "english",
    subjectName: "English Language",
    score: 18,
    percentage: 60,
    totalQuestions: 30,
    correctAnswers: 18,
    wrongAnswers: 12,
    timeUsed: 800,
    duration: 30,
    grade: "B",
    date: "2026-06-11T09:15:00Z",
    isMock: true,
    corrections: []
  },
  {
    id: "res_003",
    studentId: "stud_002",
    studentName: "Bisi Akindele",
    studentRegId: "FF/JSS3/115",
    subjectId: "maths",
    subjectName: "Mathematics",
    score: 27,
    percentage: 90,
    totalQuestions: 30,
    correctAnswers: 27,
    wrongAnswers: 3,
    timeUsed: 1450,
    duration: 30,
    grade: "A",
    date: "2026-06-12T16:00:00Z",
    isMock: true,
    corrections: []
  },
  {
    id: "res_004",
    studentId: "stud_002",
    studentName: "Bisi Akindele",
    studentRegId: "FF/JSS3/115",
    subjectId: "basic_science",
    subjectName: "Basic Science",
    score: 14,
    percentage: 46,
    totalQuestions: 30,
    correctAnswers: 14,
    wrongAnswers: 16,
    timeUsed: 1100,
    duration: 30,
    grade: "D",
    date: "2026-06-13T11:00:00Z",
    isMock: true,
    corrections: []
  }
];

export function getResultsFromDB(): Result[] {
  const dataStr = localStorage.getItem("FF_CBT_RESULTS");
  if (!dataStr) {
    localStorage.setItem("FF_CBT_RESULTS", JSON.stringify(DEFAULT_MOCK_RESULTS));
    return DEFAULT_MOCK_RESULTS;
  }
  try {
    return JSON.parse(dataStr);
  } catch (e) {
    return DEFAULT_MOCK_RESULTS;
  }
}

export function saveResult(result: Result) {
  const current = getResultsFromDB();
  current.unshift(result);
  localStorage.setItem("FF_CBT_RESULTS", JSON.stringify(current));
  logActivity(
    result.studentId,
    result.studentName,
    "STUDENT",
    "Submitted Exam",
    `Completed ${result.subjectName} ${result.isMock ? "Mock" : "Practice"} Exam. Score: ${result.correctAnswers}/${result.totalQuestions} (${result.percentage}%, Grade ${result.grade}).`
  );
}

export function getGrade(pct: number): "A" | "B" | "C" | "D" | "F" {
  if (pct >= 70) return "A";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
}

// Leaderboard computations
export interface LeaderboardEntry {
  studentId: string;
  fullName: string;
  studentIdCard: string;
  examsTaken: number;
  avgSecsPerQuestion: number;
  avgScore: number;
  highestScore: number;
}

export function getLeaderboard(): LeaderboardEntry[] {
  const results = getResultsFromDB();
  const studentsStr = localStorage.getItem("FF_CBT_USERS") || "[]";
  const users = JSON.parse(studentsStr);
  const students = users.filter((u: any) => u.role === "STUDENT");

  const leaderboard: LeaderboardEntry[] = students.map((stu: any) => {
    const stuResults = results.filter((r) => r.studentId === stu.id);
    if (stuResults.length === 0) {
      return {
        studentId: stu.id,
        fullName: stu.fullName,
        studentIdCard: stu.studentId || "N/A",
        examsTaken: 0,
        avgSecsPerQuestion: 0,
        avgScore: 0,
        highestScore: 0
      };
    }

    const avgScore = Math.round(
      stuResults.reduce((acc, curr) => acc + curr.percentage, 0) / stuResults.length
    );
    const highestScore = Math.max(...stuResults.map((r) => r.percentage));
    const totalSecs = stuResults.reduce((acc, curr) => acc + curr.timeUsed, 0);
    const totalQuest = stuResults.reduce((acc, curr) => acc + curr.totalQuestions, 0);

    return {
      studentId: stu.id,
      fullName: stu.fullName,
      studentIdCard: stu.studentId || "N/A",
      examsTaken: stuResults.length,
      avgSecsPerQuestion: totalQuest > 0 ? Math.round(totalSecs / totalQuest) : 0,
      avgScore,
      highestScore
    };
  });

  // Sort by average percentage first, then by exams taken
  return leaderboard
    .filter((e) => e.examsTaken > 0)
    .sort((a, b) => b.avgScore - a.avgScore || b.highestScore - a.highestScore);
}

// Bookmarking system
export function toggleBookmarkInDB(userId: string, questionId: string, subjectId: string): boolean {
  const currentStr = localStorage.getItem("FF_CBT_BOOKMARKS") || "[]";
  let bookmarks: BookmarkedQuestion[] = [];
  try {
    bookmarks = JSON.parse(currentStr);
  } catch (e) {
    bookmarks = [];
  }

  const idx = bookmarks.findIndex((b) => b.userId === userId && b.questionId === questionId);
  let bookmarked = false;

  if (idx !== -1) {
    bookmarks.splice(idx, 1);
    bookmarked = false;
  } else {
    bookmarks.push({ userId, questionId, subjectId });
    bookmarked = true;
  }

  localStorage.setItem("FF_CBT_BOOKMARKS", JSON.stringify(bookmarks));
  return bookmarked;
}

export function isQuestionBookmarked(userId: string, questionId: string): boolean {
  const currentStr = localStorage.getItem("FF_CBT_BOOKMARKS") || "[]";
  try {
    const list: BookmarkedQuestion[] = JSON.parse(currentStr);
    return list.some((b) => b.userId === userId && b.questionId === questionId);
  } catch (e) {
    return false;
  }
}

export function getBookmarkedQuestions(userId: string): BookmarkedQuestion[] {
  const currentStr = localStorage.getItem("FF_CBT_BOOKMARKS") || "[]";
  try {
    const list: BookmarkedQuestion[] = JSON.parse(currentStr);
    return list.filter((b) => b.userId === userId);
  } catch (e) {
    return [];
  }
}

// Performance insights: returns strong / weak topics for a student
export function getPerformanceInsights(studentId: string) {
  const results = getResultsFromDB().filter((r) => r.studentId === studentId);
  const topicPerformance: Record<string, { correct: number; total: number }> = {};

  results.forEach((res) => {
    res.corrections.forEach((corr) => {
      const topic = corr.topic || "General";
      if (!topicPerformance[topic]) {
        topicPerformance[topic] = { correct: 0, total: 0 };
      }
      topicPerformance[topic].total += 1;
      if (corr.isCorrect) {
        topicPerformance[topic].correct += 1;
      }
    });
  });

  const topicsList = Object.keys(topicPerformance).map((name) => {
    const data = topicPerformance[name];
    const pct = data.total > 0 ? (data.correct / data.total) * 100 : 0;
    return { name, pct, count: data.total };
  });

  const strongTopics = topicsList
    .filter((t) => t.pct >= 70 && t.count >= 2)
    .map((t) => t.name);
  const weakTopics = topicsList
    .filter((t) => t.pct < 50 && t.count >= 2)
    .map((t) => t.name);

  return {
    strongTopics: strongTopics.length > 0 ? strongTopics : ["Basic Fundamentals", "Curriculum Essentials"],
    weakTopics: weakTopics.length > 0 ? weakTopics : ["Advanced Formulas", "Grammar Constructs"]
  };
}
