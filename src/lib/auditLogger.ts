/**
 * Audit Logger
 * 
 * Central utility for logging audit events throughout the application.
 */

import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export type AuditAction =
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "VIEW"
    | "LOGIN"
    | "LOGOUT"
    | "APPROVE"
    | "REJECT"
    | "EXPORT"
    | "IMPORT";

export type AuditEntityType =
    | "User"
    | "Request"
    | "Order"
    | "Invoice"
    | "Contract"
    | "Supplier"
    | "Rfq"
    | "Delivery"
    | "Role"
    | "Workflow"
    | "System";

export interface AuditLogEntry {
    userId?: string | null;
    action: AuditAction;
    entityType: AuditEntityType;
    entityId?: string | null;
    oldData?: Record<string, any> | null;
    newData?: Record<string, any> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
}

/**
 * Log an audit event to the database
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                userId: entry.userId || null,
                action: entry.action,
                entityType: entry.entityType,
                entityId: entry.entityId || null,
                oldData: entry.oldData ?? undefined,
                newData: entry.newData ?? undefined,
                ipAddress: entry.ipAddress || null,
                userAgent: entry.userAgent || null,
            },
        });
    } catch (error) {
        // Log to console but don't throw - audit logging should not break main flow
        console.error("[AuditLog] Failed to create log entry:", error);
    }
}

/**
 * Log an audit event with request context (extracts IP and User-Agent automatically)
 */
export async function logAuditWithRequest(
    req: NextRequest,
    entry: Omit<AuditLogEntry, "ipAddress" | "userAgent">
): Promise<void> {
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || req.headers.get("x-real-ip")
        || "unknown";
    const userAgent = req.headers.get("user-agent") || undefined;

    await logAudit({
        ...entry,
        ipAddress,
        userAgent,
    });
}

/**
 * Helper to compute changes between two objects (for UPDATE actions)
 */
export function computeChanges(
    oldData: Record<string, any>,
    newData: Record<string, any>
): { old: Record<string, any>; new: Record<string, any> } | null {
    const changes: { old: Record<string, any>; new: Record<string, any> } = {
        old: {},
        new: {},
    };

    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    for (const key of allKeys) {
        // Skip internal/sensitive fields
        if (["passwordHash", "createdAt", "updatedAt", "id"].includes(key)) continue;

        const oldVal = oldData[key];
        const newVal = newData[key];

        // Check if values are different
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            changes.old[key] = oldVal;
            changes.new[key] = newVal;
        }
    }

    // Return null if no changes detected
    if (Object.keys(changes.old).length === 0) return null;

    return changes;
}

/**
 * Format a log entry for display (Turkish localization)
 */
export function formatAuditAction(action: AuditAction): string {
    const labels: Record<AuditAction, string> = {
        CREATE: "Oluşturma",
        UPDATE: "Güncelleme",
        DELETE: "Silme",
        VIEW: "Görüntüleme",
        LOGIN: "Giriş",
        LOGOUT: "Çıkış",
        APPROVE: "Onaylama",
        REJECT: "Reddetme",
        EXPORT: "Dışa Aktarma",
        IMPORT: "İçe Aktarma",
    };
    return labels[action] || action;
}

export function formatEntityType(entityType: AuditEntityType): string {
    const labels: Record<AuditEntityType, string> = {
        User: "Kullanıcı",
        Request: "Talep",
        Order: "Sipariş",
        Invoice: "Fatura",
        Contract: "Sözleşme",
        Supplier: "Tedarikçi",
        Rfq: "Teklif Talebi",
        Delivery: "Teslimat",
        Role: "Rol",
        Workflow: "İş Akışı",
        System: "Sistem",
    };
    return labels[entityType] || entityType;
}
