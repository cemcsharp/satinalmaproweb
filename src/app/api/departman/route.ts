import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { requirePermissionApi } from "@/lib/apiAuth";

/**
 * GET /api/departman
 * Departman listesini getirir
 */
export async function GET(req: NextRequest) {
    try {
        const user = await requirePermissionApi(req, "ayarlar:read");
        if (!user) return jsonError(403, "forbidden");

        const departments = await prisma.department.findMany({
            where: user.isSuperAdmin ? {} : { tenantId: user.tenantId },
            include: {
                _count: { select: { users: true } }
            },
            orderBy: { name: "asc" }
        });

        return NextResponse.json({ items: departments });
    } catch (e: any) {
        console.error("[Departman API] Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}

/**
 * POST /api/departman
 * Yeni departman oluşturur
 */
export async function POST(req: NextRequest) {
    try {
        const user = await requirePermissionApi(req, "user:manage");
        if (!user) return jsonError(403, "forbidden");

        const body = await req.json();
        const { name, code } = body;

        if (!name || !code) {
            return jsonError(400, "missing_fields");
        }

        const newDept = await prisma.department.create({
            data: {
                name,
                code,
                tenantId: user.tenantId
            }
        });

        return NextResponse.json(newDept, { status: 201 });
    } catch (e: any) {
        console.error("[Departman Create] Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}
