import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { getPermissionInfo } from "@/lib/permissions";

// Role hierarchy: admin > manager > user
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

  if (!userId) {
    return null;
  }

  // Fetch actual user role from DB with relation
  const user = await prisma.user.findUnique({
    where: { id: String(userId) },
    include: { roleRef: true }
  }).catch(() => null);

  if (!user) return null;

  // Prioritize roleRef.key, fallback to user.role string
  const role = (user.roleRef?.key || user.role || "user") as Role;

  return { id: user.id, role };
}

export async function ensureRole(required: Role | Role[]): Promise<{ id: string; role: Role } | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const roles = Array.isArray(required) ? required : [required];

  // Admin can do anything
  if (user.role === "admin") return user;

  // Check if user role is in required roles
  if (roles.includes(user.role)) return user;

  return null;
}

export async function ensureRoleApi(req: NextRequest, required: Role | Role[]): Promise<{ id: string; role: Role } | null> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = (token as any)?.userId || (token as any)?.sub || null;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: String(userId) },
    include: { roleRef: true }
  });
  if (!user) return null;

  // Prioritize roleRef.key
  const role: Role = (user.roleRef?.key || user.role || "user") as Role;

  const roles = Array.isArray(required) ? required : [required];

  // Admin can do anything
  if (role === "admin") return { id: user.id, role };

  // Check if user role is in required roles
  if (roles.includes(role)) return { id: user.id, role };

  return null;
}

export async function ensureAdminApi(req: NextRequest): Promise<{ id: string; role: Role } | null> {
  return ensureRoleApi(req, "admin");
}

export async function ensurePermission(permission: string): Promise<{ id: string; role: Role } | null> {
  const user = await getSessionUser();
  if (!user) return null;

  // Admin has all permissions
  if (user.role === "admin") return user;

  // Re-fetch user with full permission context
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { roleRef: true }
  });

  const permissions = (fullUser?.roleRef?.permissions as string[]) || [];
  if (permissions.includes(permission)) return user;

  return null;
}

export type UserWithPermissions = {
  id: string;
  role: Role;
  permissions: string[];
  unitId: string | null;
  unitLabel: string | null;
  isAdmin: boolean;
};

export async function getUserWithPermissions(req: NextRequest): Promise<UserWithPermissions | null> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return null;
  const userId = (token as any)?.userId || (token as any)?.sub || null;
  if (!userId) return null;

  // Fetch user with unit and roleRef
  const user = await prisma.user.findUnique({
    where: { id: String(userId) },
    include: {
      unit: true,
      roleRef: true // Include role relation
    }
  });
  if (!user) return null;

  let roleKey: Role = (user.role as Role) || "user";

  // Try to get permissions from Role table first
  let permissions: string[] = [];

  if (user.roleRef && user.roleRef.permissions) {
    // Database-driven permissions from Role table
    const rolePerms = user.roleRef.permissions;
    if (Array.isArray(rolePerms)) {
      permissions = rolePerms as string[];
    } else if (typeof rolePerms === 'object') {
      // Legacy JSON object format - extract keys
      permissions = Object.keys(rolePerms).filter(k => (rolePerms as any)[k]);
    }
    // Use role key from Role table if available
    if (user.roleRef.key) {
      roleKey = user.roleRef.key as Role;
    }
  }

  // No fallback to hardcoded permissions. If it's not in DB, it doesn't exist.
  if (permissions.length === 0 && roleKey !== "admin") {
    // Optionally log this as a potential configuration issue
    console.warn(`[apiAuth] No permissions found for user ${userId} with role ${roleKey}`);
  }

  // Admin always gets all permissions
  if (roleKey === "admin") {
    const { ALL_PERMISSIONS } = await import("@/lib/permissions");
    permissions = [...ALL_PERMISSIONS];
  }

  return {
    id: user.id,
    role: roleKey,
    permissions,
    unitId: user.unitId,
    unitLabel: user.unit?.label || null,
    isAdmin: roleKey === "admin"
  };
}

export function userHasPermission(user: UserWithPermissions, permission: string): boolean {
  if (user.isAdmin) return true;
  return user.permissions.includes(permission);
}

// Utility: Check if user can access a module with specific action
export function canAccess(role: Role, module: string, action: "read" | "write" | "delete"): boolean {
  if (role === "admin") return true;
  // This legacy function is now deprecated in favor of specific permission checks
  return false;
}

/**
 * Require specific permission(s) for API access.
 * Returns user with permissions if authorized, or null if not.
 * Use this at the start of any API handler that needs permission control.
 */
export async function requirePermissionApi(
  req: NextRequest,
  requiredPermission: string | string[]
): Promise<UserWithPermissions | null> {
  const user = await getUserWithPermissions(req);
  if (!user) return null;

  // Admin bypass
  if (user.isAdmin) return user;

  // Check permissions
  const perms = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
  const hasAny = perms.some(p => user.permissions.includes(p));

  if (!hasAny) {
    console.warn(`[Permission Denied] User ${user.id} lacks: ${perms.join(', ')}`);
    return null;
  }

  return user;
}
