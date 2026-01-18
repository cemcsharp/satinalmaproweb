import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { requirePermissionApi } from "@/lib/apiAuth";

/**
 * GET /api/tedarikci/segmentasyon
 * Stratejik Tedarikçi Segmentasyonu Analizi
 */
export async function GET(req: NextRequest) {
    try {
        const user = await requirePermissionApi(req, "report:view");
        if (!user) return jsonError(403, "forbidden");

        // 1. Tüm aktif tedarikçileri ve son performans özetlerini çek
        const suppliers = await prisma.supplier.findMany({
            where: { active: true },
            include: {
                evaluationSummaries: {
                    orderBy: { createdAt: "desc" },
                    take: 1
                }
            }
        });

        // 2. Segmentasyon Mantığı
        const segmentation = suppliers.map(s => {
            const lastEval = s.evaluationSummaries[0];
            const score = lastEval ? lastEval.totalScore : Number(s.score || 0);

            let segment: "GOLD" | "SILVER" | "BRONZE" = "BRONZE";
            if (score >= 85) segment = "GOLD";
            else if (score >= 65) segment = "SILVER";

            return {
                id: s.id,
                name: s.name,
                score: Number(score.toFixed(1)),
                segment,
                metrics: lastEval ? {
                    quality: lastEval.qualityScore,
                    delivery: lastEval.deliveryScore
                } : null
            };
        });

        // 3. Dağılım İstatistikleri
        const stats = {
            GOLD: segmentation.filter(s => s.segment === "GOLD").length,
            SILVER: segmentation.filter(s => s.segment === "SILVER").length,
            BRONZE: segmentation.filter(s => s.segment === "BRONZE").length,
            total: segmentation.length
        };

        return NextResponse.json({
            stats,
            segmentation
        });

    } catch (e: any) {
        console.error("[Segmentation API] Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}
