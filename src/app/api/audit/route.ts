import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureAdminApi } from "@/lib/apiAuth";
import { jsonError } from "@/lib/apiError";

// GET - List audit logs with pagination
export async function GET(req: NextRequest) {
    try {
        const admin = await ensureAdminApi(req);
        if (!admin) return jsonError(403, "forbidden");

        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const entityType = url.searchParams.get("entityType");
        const entityId = url.searchParams.get("entityId");
        const userId = url.searchParams.get("userId");
        const action = url.searchParams.get("action");

        const where: any = {};
        if (entityType) where.entityType = entityType;
        if (entityId) where.entityId = entityId;
        if (userId) where.userId = userId;
        if (action) where.action = action;

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

        return NextResponse.json({
            items: logs,
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
const ENTITY_TYPES = [
    "User", "Role", "Request", "Order", "Delivery",
    "Invoice", "Contract", "Supplier", "Session", "Settings"
];

// Actions available
const ACTIONS = [
    "CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT",
    "VIEW", "EXPORT", "APPROVE", "REJECT"
];
