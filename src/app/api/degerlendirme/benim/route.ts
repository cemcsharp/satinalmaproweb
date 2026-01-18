import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { requirePermissionApi } from "@/lib/apiAuth";

/**
 * GET /api/degerlendirme/benim
 * Kullanıcının biriminin yaptığı tedarikçi değerlendirmelerini getirir
 */
export async function GET(req: NextRequest) {
    try {
        const user = await requirePermissionApi(req, "talep:read");
        if (!user) return jsonError(403, "forbidden");

        // Fetch evaluations for requests owned by this user's unit
        const evaluations = await prisma.supplierEvaluation.findMany({
            where: user.unitId ? {
                order: {
                    request: {
                        unitId: user.unitId
                    }
                }
            } : {
                order: {
                    request: {
                        ownerUserId: user.id
                    }
                }
            },
            include: {
                supplier: {
                    select: { name: true }
                },
                order: {
                    select: { orderNo: true }
                }
            },
            orderBy: { createdAt: "desc" },
            take: 50
        });

        const items = evaluations.map(ev => ({
            id: ev.id,
            supplierName: ev.supplier.name,
            orderNo: ev.order?.orderNo || "-",
            deliveryScore: Number(ev.deliveryScore),
            qualityScore: Number(ev.qualityScore),
            communicationScore: Number(ev.communicationScore),
            overallScore: Number(ev.overallScore),
            comment: ev.comments || "",
            createdAt: ev.createdAt.toISOString()
        }));

        return NextResponse.json({ items });

    } catch (e: any) {
        console.error("[Değerlendirmelerim API] Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}
