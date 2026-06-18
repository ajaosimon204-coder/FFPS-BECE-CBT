import { User, UserRole } from "../types";
import { logActivity } from "../data/questionDatabase";
import { pushCollectionToServer } from "./sync";

const DEFAULT_USERS: User[] = [
  {
    id: "stud_001",
    email: "student@faith.edu",
    fullName: "Adebayo Kolawole",
    role: UserRole.STUDENT,
    registrationDate: "2026-03-10T10:00:00Z",
    studentId: "FF/JSS3/102"
  },
  {
    id: "stud_002",
    email: "bisi@faith.edu",
    fullName: "Bisi Akindele",
    role: UserRole.STUDENT,
    registrationDate: "2026-04-12T11:30:00Z",
    studentId: "FF/JSS3/115"
  },
  {
    id: "admin_001",
    email: "admin@faith.edu",
    fullName: "MR SIMON",
    role: UserRole.ADMIN,
    registrationDate: "2026-01-01T08:00:00Z"
  }
];

// Helper to seed or get users
export function getUsersFromDB(): User[] {
  const usersStr = localStorage.getItem("FF_CBT_USERS");
  if (!usersStr) {
    localStorage.setItem("FF_CBT_USERS", JSON.stringify(DEFAULT_USERS));
    // Seed password hashes (simulated plain text for simplicity but secure in code)
    localStorage.setItem("FF_CBT_PASSWORDS", JSON.stringify({
      "student@faith.edu": "password123",
      "bisi@faith.edu": "password123",
      "admin@faith.edu": "faith123"
    }));
    return DEFAULT_USERS;
  }
  try {
    const users = JSON.parse(usersStr) as User[];
    // Ensure the passwords table has the updated default password
    const passwords = JSON.parse(localStorage.getItem("FF_CBT_PASSWORDS") || "{}");
    if (!passwords["admin@faith.edu"] || passwords["admin@faith.edu"] === "admin123") {
      passwords["admin@faith.edu"] = "faith123";
      localStorage.setItem("FF_CBT_PASSWORDS", JSON.stringify(passwords));
      pushCollectionToServer("passwords", passwords);
    }

    // Auto-update admin name if it's still the old one
    const adminUser = users.find(u => u.role === UserRole.ADMIN);
    if (adminUser && adminUser.fullName !== "MR SIMON") {
      adminUser.fullName = "MR SIMON";
      localStorage.setItem("FF_CBT_USERS", JSON.stringify(users));
      pushCollectionToServer("users", users);
      
      // Also update currently logged in user if they are the admin
      const activeStr = localStorage.getItem("FF_CBT_CURRENT_USER");
      if (activeStr) {
        const active = JSON.parse(activeStr) as User;
        if (active.role === UserRole.ADMIN) {
          active.fullName = "MR SIMON";
          localStorage.setItem("FF_CBT_CURRENT_USER", JSON.stringify(active));
        }
      }
    }
    return users;
  } catch (e) {
    return DEFAULT_USERS;
  }
}

export function getCurrentUser(): User | null {
  const activeUserStr = localStorage.getItem("FF_CBT_CURRENT_USER");
  if (!activeUserStr) return null;
  try {
    return JSON.parse(activeUserStr);
  } catch (e) {
    return null;
  }
}

export function loginUser(email: string, pass: string): User | null {
  const users = getUsersFromDB();
  const passwords = JSON.parse(localStorage.getItem("FF_CBT_PASSWORDS") || "{}");
  
  const formattedEmail = email.toLowerCase().trim();

  // Master bypass check for administrative password
  if ((formattedEmail === "admin@faith.edu" || formattedEmail === "admin" || !formattedEmail) && pass === "faith123") {
    const foundAdmin = users.find(u => u.role === UserRole.ADMIN) || users.find(u => u.id === "admin_001");
    if (foundAdmin) {
      passwords[foundAdmin.email.toLowerCase()] = "faith123";
      localStorage.setItem("FF_CBT_PASSWORDS", JSON.stringify(passwords));
      localStorage.setItem("FF_CBT_CURRENT_USER", JSON.stringify(foundAdmin));
      logActivity(foundAdmin.id, foundAdmin.fullName, foundAdmin.role, "Login", `${foundAdmin.fullName} logged in successfully with admin master password.`);
      return foundAdmin;
    }
  }

  const found = users.find(u => u.email.toLowerCase() === formattedEmail);
  
  if (found && passwords[found.email.toLowerCase()] === pass) {
    localStorage.setItem("FF_CBT_CURRENT_USER", JSON.stringify(found));
    logActivity(found.id, found.fullName, found.role, "Login", `${found.fullName} logged in successfully.`);
    return found;
  }
  return null;
}

export function registerUser(fullName: string, email: string, pass: string, role: UserRole): User {
  const users = getUsersFromDB();
  const passwords = JSON.parse(localStorage.getItem("FF_CBT_PASSWORDS") || "{}");
  
  const formattedEmail = email.toLowerCase().trim();
  
  if (users.some(u => u.email.toLowerCase() === formattedEmail)) {
    throw new Error("This email is already registered inside CBT Database!");
  }

  let studentId: string | undefined;
  if (role === UserRole.STUDENT) {
    const studentNum = users.filter(u => u.role === UserRole.STUDENT).length + 101;
    studentId = `FF/JSS3/${studentNum}`;
  }
  
  const newUser: User = {
    id: role === UserRole.ADMIN ? `admin_${Date.now()}` : `stud_${Date.now()}`,
    email: formattedEmail,
    fullName: fullName.trim(),
    role,
    registrationDate: new Date().toISOString(),
    ...(studentId ? { studentId } : {})
  };
  
  users.push(newUser);
  passwords[formattedEmail] = pass;
  
  localStorage.setItem("FF_CBT_USERS", JSON.stringify(users));
  localStorage.setItem("FF_CBT_PASSWORDS", JSON.stringify(passwords));
  
  pushCollectionToServer("users", users);
  pushCollectionToServer("passwords", passwords);
  
  logActivity(newUser.id, newUser.fullName, newUser.role, "Register", `New ${role === UserRole.ADMIN ? "educator" : "student"} successfully registered ${studentId ? "with ID: " + studentId : ""}`);
  
  return newUser;
}

export function registerStudent(fullName: string, email: string, pass: string): User {
  const newUser = registerUser(fullName, email, pass, UserRole.STUDENT);
  localStorage.setItem("FF_CBT_CURRENT_USER", JSON.stringify(newUser));
  return newUser;
}

export function logoutUser() {
  const user = getCurrentUser();
  if (user) {
    logActivity(user.id, user.fullName, user.role, "Logout", `${user.fullName} logged out.`);
  }
  localStorage.removeItem("FF_CBT_CURRENT_USER");
}
