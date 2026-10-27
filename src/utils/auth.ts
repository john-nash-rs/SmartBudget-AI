import { StoredUser, User, UserSession } from "@/types/auth";

const USERS_KEY = "smartbudget_users";
const SESSION_KEY = "smartbudget_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// SHA-256 password hashing (demo-grade, not for production)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "smartbudget_salt_v1");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}

// User storage functions
export function getStoredUsers(): StoredUser[] {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function findUserByEmail(email: string): StoredUser | undefined {
  return getStoredUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

// Session management
export function getSession(): UserSession | null {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    if (!data) return null;
    
    const session: UserSession = JSON.parse(data);
    if (session.expiresAt < Date.now()) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveSession(session: UserSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): User | null {
  const session = getSession();
  if (!session) return null;
  
  const storedUser = getStoredUsers().find(u => u.id === session.userId);
  if (!storedUser) {
    clearSession();
    return null;
  }
  
  return {
    id: storedUser.id,
    name: storedUser.name,
    email: storedUser.email,
    createdAt: storedUser.createdAt,
  };
}

// Auth actions
export async function signup(
  name: string,
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  const existingUser = findUserByEmail(email);
  if (existingUser) {
    return { success: false, error: "An account with this email already exists" };
  }
  
  const passwordHash = await hashPassword(password);
  const newUser: StoredUser = {
    id: generateId(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  
  const users = getStoredUsers();
  users.push(newUser);
  saveUsers(users);
  
  // Create session
  const session: UserSession = {
    userId: newUser.id,
    token: generateToken(),
    expiresAt: Date.now() + SESSION_DURATION,
  };
  saveSession(session);
  
  return {
    success: true,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt,
    },
  };
}

export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  const storedUser = findUserByEmail(email);
  if (!storedUser) {
    return { success: false, error: "Invalid email or password" };
  }
  
  const passwordHash = await hashPassword(password);
  if (passwordHash !== storedUser.passwordHash) {
    return { success: false, error: "Invalid email or password" };
  }
  
  // Create session
  const session: UserSession = {
    userId: storedUser.id,
    token: generateToken(),
    expiresAt: Date.now() + SESSION_DURATION,
  };
  saveSession(session);
  
  return {
    success: true,
    user: {
      id: storedUser.id,
      name: storedUser.name,
      email: storedUser.email,
      createdAt: storedUser.createdAt,
    },
  };
}

export function logout(): void {
  clearSession();
}
