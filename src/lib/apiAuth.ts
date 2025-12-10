import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";

// Simplified type
export type Role = "admin" | "manager" | "user" | string;

export type ApiAuth = { userId: string } | null;

export async function requireAuthApi(req: NextRequest): Promise<ApiAuth> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return null;
  const userId = (token as any)?.userId || (token as any)?.sub || null;
  if (!userId) return null;
  return { userId: String(userId) };
}

export async function getSessionUser(): Promise<{ id: string; role: Role } | null> {
  const session = await getServerSession(authOptions);
  let userId = (session as any)?.user?.id || (session as any)?.userId || null;
  let email = (session as any)?.user?.email || null;
  let role = ((session as any)?.user?.role as Role) || "user";

  if (!userId) {
    // Session fallback
    if (email && String(email).toLowerCase() === "admin@sirket.com") {
      return { id: String(email), role: "admin" };
    }
    return null;
  }

  // Fetch updated user role from DB if possible, but no Role table lookup
  const me = await prisma.user.findUnique({ where: { id: String(userId) } }).catch(() => null);
  if (me) {
    role = (me.role as Role) || "user";
  }

  // Admin override by email
  if (me && (me.username === "admin" || String(me.email || "").toLowerCase() === "admin@sirket.com")) {
    role = "admin";
  }

  return { id: (me?.id || String(userId)), role };
}

export async function ensureRole(required: Role | Role[]): Promise<{ id: string; role: Role } | null> {
  // Return user if logged in. Role checks are soft/removed.
  // Ideally we respect "required", but user asked to remove system.
  // We will just return user if exists.
  return await getSessionUser();
}

export async function ensureRoleApi(req: NextRequest, required: Role | Role[]): Promise<{ id: string; role: Role } | null> {
  // Similar to above, ignore strict requirement or rely on user.role string
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = (token as any)?.userId || (token as any)?.sub || null;
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: String(userId) } });
  if (!user) return null;
  return { id: user.id, role: user.role as Role };
}

export async function ensureAdminApi(req: NextRequest): Promise<{ id: string; role: Role } | null> {
  return ensureRoleApi(req, "admin");
}

export async function ensurePermission(permission: string): Promise<{ id: string; role: Role } | null> {
  // Permission system removed -> Allow all authenticated
  return await getSessionUser();
}

export type UserWithPermissions = {
  id: string;
  role: string;
  permissions: string[];
  unitId: string | null;
  isAdmin: boolean;
};

export async function getUserWithPermissions(req: NextRequest): Promise<UserWithPermissions | null> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return null;
  const userId = (token as any)?.userId || (token as any)?.sub || null;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: String(userId) } // No include roleRef
  });
  if (!user) return null;

  return {
    id: user.id,
    role: user.role,
    permissions: [], // No dynamic permissions
    unitId: user.unitId,
    isAdmin: user.role === "admin" || user.username === "admin"
  };
}

export function userHasPermission(user: UserWithPermissions, permission: string): boolean {
  // Always true as requested to remove restrictions
  return true;
}
