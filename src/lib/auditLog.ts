import { prisma } from "@/lib/db";

export type AuditAction =
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "LOGIN"
    | "LOGOUT"
    | "VIEW"
    | "EXPORT"
    | "APPROVE"
    | "REJECT";

type AuditLogParams = {
    userId?: string | null;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    oldData?: object | null;
    newData?: object | null;
    ipAddress?: string | null;
    userAgent?: string | null;
};

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                userId: params.userId || null,
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId || null,
                oldData: params.oldData || null,
                newData: params.newData || null,
                ipAddress: params.ipAddress || null,
                userAgent: params.userAgent || null,
            },
        });
    } catch (error) {
        // Silently fail - audit logs should not break the main flow
        console.error("[AuditLog] Failed to create log:", error);
    }
}

/**
 * Log a CREATE action
 */
export async function logCreate(
    userId: string | null,
    entityType: string,
    entityId: string,
    data: object,
    req?: Request
) {
    await createAuditLog({
        userId,
        action: "CREATE",
        entityType,
        entityId,
        newData: data,
        ipAddress: req?.headers.get("x-forwarded-for") || req?.headers.get("x-real-ip"),
        userAgent: req?.headers.get("user-agent"),
    });
}

/**
 * Log an UPDATE action
 */
export async function logUpdate(
    userId: string | null,
    entityType: string,
    entityId: string,
    oldData: object,
    newData: object,
    req?: Request
) {
    await createAuditLog({
        userId,
        action: "UPDATE",
        entityType,
        entityId,
        oldData,
        newData,
        ipAddress: req?.headers.get("x-forwarded-for") || req?.headers.get("x-real-ip"),
        userAgent: req?.headers.get("user-agent"),
    });
}

/**
 * Log a DELETE action
 */
export async function logDelete(
    userId: string | null,
    entityType: string,
    entityId: string,
    data: object,
    req?: Request
) {
    await createAuditLog({
        userId,
        action: "DELETE",
        entityType,
        entityId,
        oldData: data,
        ipAddress: req?.headers.get("x-forwarded-for") || req?.headers.get("x-real-ip"),
        userAgent: req?.headers.get("user-agent"),
    });
}

/**
 * Log a LOGIN action
 */
export async function logLogin(userId: string, req?: Request) {
    await createAuditLog({
        userId,
        action: "LOGIN",
        entityType: "Session",
        ipAddress: req?.headers.get("x-forwarded-for") || req?.headers.get("x-real-ip"),
        userAgent: req?.headers.get("user-agent"),
    });
}

/**
 * Log a LOGOUT action
 */
export async function logLogout(userId: string, req?: Request) {
    await createAuditLog({
        userId,
        action: "LOGOUT",
        entityType: "Session",
        ipAddress: req?.headers.get("x-forwarded-for") || req?.headers.get("x-real-ip"),
        userAgent: req?.headers.get("user-agent"),
    });
}
