import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { requirePermissionApi } from "@/lib/apiAuth";

/**
 * GET /api/finans/sozlesmeler
 * Sistemdeki sözleşmeleri listeler.
 */
export async function GET(req: NextRequest) {
    try {
        const user = await requirePermissionApi(req, "sozlesme:read");
        if (!user) return jsonError(403, "forbidden");

        const sozlesmeler = await prisma.contract.findMany({
            where: user.isSuperAdmin ? {} : {
                tenantId: user.tenantId
            },
            include: {
                responsible: { select: { username: true } },
                order: { select: { barcode: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        const now = new Date();
        const items = sozlesmeler.map(s => {
            const isExpiringSoon = s.endDate && (new Date(s.endDate).getTime() - now.getTime()) < (30 * 24 * 60 * 60 * 1000); // 30 days
            const isExpired = s.endDate && new Date(s.endDate) < now;

            return {
                id: s.id,
                number: s.number,
                title: s.title,
                parties: s.parties,
                startDate: s.startDate,
                endDate: s.endDate,
                status: isExpired ? "EXPIRED" : s.status,
                isExpiringSoon,
                responsible: s.responsible?.username || "Atanmamış",
                orderNo: s.order?.barcode || null,
                type: s.type || "Genel"
            };
        });

        return NextResponse.json({ items });

    } catch (e: any) {
        console.error("[Contract API] Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}

/**
 * POST /api/finans/sozlesmeler
 * Yeni sözleşme kaydı
 */
export async function POST(req: NextRequest) {
    try {
        const user = await requirePermissionApi(req, "sozlesme:manage");
        if (!user) return jsonError(403, "forbidden");

        const body = await req.json();
        const { number, title, parties, startDate, endDate, type, responsibleUserId } = body;

        if (!number || !title || !parties || !startDate) {
            return jsonError(400, "missing_fields");
        }

        const newContract = await prisma.contract.create({
            data: {
                number,
                title,
                parties,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                type,
                status: "ACTIVE",
                responsibleUserId: responsibleUserId || user.id,
                tenantId: user.tenantId
            }
        });

        return NextResponse.json(newContract);

    } catch (e: any) {
        if (e.code === 'P2002') return jsonError(409, "duplicate_number");
        console.error("[Contract Create] Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}
