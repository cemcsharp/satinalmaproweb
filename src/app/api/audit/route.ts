import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionApi, getUserWithPermissions } from "@/lib/apiAuth";
import { jsonError } from "@/lib/apiError";
import { formatAuditAction, formatEntityType, type AuditAction, type AuditEntityType } from "@/lib/auditLogger";

// GET - List audit logs with pagination
export async function GET(req: NextRequest) {
    try {
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");

        const hasAyarlarRead = user.isAdmin || user.permissions.includes("ayarlar:read");

        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const entityType = url.searchParams.get("entityType");
        const entityId = url.searchParams.get("entityId");
        const userId = url.searchParams.get("userId");
        const action = url.searchParams.get("action");
        const dateFrom = url.searchParams.get("dateFrom");
        const dateTo = url.searchParams.get("dateTo");

        const where: any = {};
        if (entityType) where.entityType = entityType;
        if (entityId) where.entityId = entityId;

        // Security: Non-admin users can ONLY see their own logs unless they have ayarlar:read
        if (!hasAyarlarRead) {
            where.userId = user.id;
        } else if (userId) {
            where.userId = userId;
        }

        if (action) where.action = action;
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt.gte = new Date(dateFrom);
            if (dateTo) where.createdAt.lte = new Date(dateTo);
        }

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: {
                        select: { id: true, username: true, email: true }
                    }
                }
            }),
            prisma.auditLog.count({ where })
        ]);

        // Format items with Turkish labels
        const items = logs.map((log: typeof logs[number]) => ({
            id: log.id,
            userId: log.userId,
            username: log.user?.username || "-",
            action: log.action,
            actionLabel: formatAuditAction(log.action as AuditAction),
            entityType: log.entityType,
            entityTypeLabel: formatEntityType(log.entityType as AuditEntityType),
            entityId: log.entityId,
            oldData: log.oldData,
            newData: log.newData,
            ipAddress: log.ipAddress,
            createdAt: log.createdAt.toISOString(),
        }));

        return NextResponse.json({
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (e) {
        console.error("[AuditLog API]", e);
        return jsonError(500, "server_error");
    }
}

// Entity types available
export const ENTITY_TYPES = [
    "User", "Role", "Request", "Order", "Delivery",
    "Invoice", "Contract", "Supplier", "Rfq", "Session", "Settings"
];

// Actions available
export const ACTIONS = [
    "CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT",
    "VIEW", "EXPORT", "IMPORT", "APPROVE", "REJECT"
];
