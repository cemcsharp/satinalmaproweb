import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";

// Role hierarchy: admin > manager > user
export type Role = "admin" | "manager" | "user";

export type ApiAuth = { userId: string } | null;

// Module permissions mapping
const MODULE_PERMISSIONS: Record<string, { read: Role[]; write: Role[]; delete: Role[] }> = {
  talep: { read: ["admin", "manager", "user"], write: ["admin", "manager", "user"], delete: ["admin", "manager"] },
  siparis: { read: ["admin", "manager", "user"], write: ["admin", "manager"], delete: ["admin"] },
  teslimat: { read: ["admin", "manager", "user"], write: ["admin", "manager"], delete: ["admin"] },
  fatura: { read: ["admin", "manager"], write: ["admin", "manager"], delete: ["admin"] },
  sozlesme: { read: ["admin", "manager"], write: ["admin"], delete: ["admin"] },
  tedarikci: { read: ["admin", "manager"], write: ["admin"], delete: ["admin"] },
  kullanicilar: { read: ["admin", "manager"], write: ["admin"], delete: ["admin"] },
  ayarlar: { read: ["admin"], write: ["admin"], delete: ["admin"] },
};

// Admin emails (automatic admin role)
const ADMIN_EMAILS = ["admin@sirket.com", "admin@satinalmapro.com"];

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
  let role: Role = "user";

  if (!userId) {
    // Check admin email fallback
    if (email && ADMIN_EMAILS.includes(String(email).toLowerCase())) {
      return { id: String(email), role: "admin" };
    }
    return null;
  }

  // Fetch actual user role from DB
  const user = await prisma.user.findUnique({ where: { id: String(userId) } }).catch(() => null);
  if (user) {
    role = (user.role as Role) || "user";
    // Admin override by email
    if (user.email && ADMIN_EMAILS.includes(String(user.email).toLowerCase())) {
      role = "admin";
    }
  }

  return { id: (user?.id || String(userId)), role };
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

  const user = await prisma.user.findUnique({ where: { id: String(userId) } });
  if (!user) return null;

  let role: Role = (user.role as Role) || "user";

  // Admin override by email
  if (user.email && ADMIN_EMAILS.includes(String(user.email).toLowerCase())) {
    role = "admin";
  }

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

  // Parse permission: "module:action" e.g., "siparis:write"
  const [module, action] = permission.split(":");
  const perms = MODULE_PERMISSIONS[module];

  if (!perms) return user; // Unknown module = allow authenticated

  const allowedRoles = perms[action as keyof typeof perms] || [];
  if (allowedRoles.includes(user.role)) return user;

  return null;
}

export type UserWithPermissions = {
  id: string;
  role: Role;
  permissions: string[];
  unitId: string | null;
  isAdmin: boolean;
};

export async function getUserWithPermissions(req: NextRequest): Promise<UserWithPermissions | null> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return null;
  const userId = (token as any)?.userId || (token as any)?.sub || null;
  if (!userId) return null;

  // Fetch user with their role relation
  const user = await prisma.user.findUnique({
    where: { id: String(userId) },
    include: { roleRef: true }
  });
  if (!user) return null;

  let roleKey: Role = (user.role as Role) || "user";
  let permissions: string[] = [];

  // Admin override by email
  if (user.email && ADMIN_EMAILS.includes(String(user.email).toLowerCase())) {
    roleKey = "admin";
  }

  // Try to get permissions from roleRef (dynamic Role table)
  if (user.roleRef && user.roleRef.permissions) {
    const rolePerms = user.roleRef.permissions as Record<string, string[]>;
    Object.entries(rolePerms).forEach(([module, actions]) => {
      (actions || []).forEach((action) => {
        permissions.push(`${module}:${action}`);
      });
    });
    roleKey = user.roleRef.key as Role;
  } else {
    // Fallback: Try to find role from DB by key
    const roleFromDb = await prisma.role.findUnique({ where: { key: roleKey } });
    if (roleFromDb && roleFromDb.permissions) {
      const rolePerms = roleFromDb.permissions as Record<string, string[]>;
      Object.entries(rolePerms).forEach(([module, actions]) => {
        (actions || []).forEach((action) => {
          permissions.push(`${module}:${action}`);
        });
      });
    } else {
      // Ultimate fallback: use hardcoded permissions
      Object.entries(MODULE_PERMISSIONS).forEach(([module, perms]) => {
        if (perms.read.includes(roleKey)) permissions.push(`${module}:read`);
        if (perms.write.includes(roleKey)) permissions.push(`${module}:write`);
        if (perms.delete.includes(roleKey)) permissions.push(`${module}:delete`);
      });
    }
  }

  return {
    id: user.id,
    role: roleKey,
    permissions,
    unitId: user.unitId,
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
  const perms = MODULE_PERMISSIONS[module];
  if (!perms) return true; // Unknown module = allow
  return perms[action]?.includes(role) || false;
}

