import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Development-only password store (kept for backward compatibility)
// For real usage, prefer DB-backed users and bcrypt hashing
const __pwdStore: Record<string, string> = {};

// JWT secret for development
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production";

// Password management functions
export function setUserPassword(userId: string, password: string): void {
  __pwdStore[userId] = password;
}

export function getUserPassword(userId: string): string | undefined {
  return __pwdStore[userId];
}

// Password hashing helpers (bcryptjs)
export async function hashPassword(plain: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(plain, saltRounds);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// JWT token management for session handling
export function signSession(payload: { userId: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifySession(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
}

// JWT token management for password reset
export function signResetToken(payload: { userId: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

export function verifyResetToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
}