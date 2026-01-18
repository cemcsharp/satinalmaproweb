import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { requirePermissionApi } from "@/lib/apiAuth";

/**
 * GET /api/raporlama/pivot
 * Merkezi Analitik API: Harcama, Tasarruf ve Bütçe Verilerini Özetler
 */
export async function GET(req: NextRequest) {
    try {
        const user = await requirePermissionApi(req, "report:view");
        if (!user) return jsonError(403, "forbidden");

        const { searchParams } = new URL(req.url);
        const year = Number(searchParams.get("year") || new Date().getFullYear());

        // 1. Departman Bazlı Harcama Dağılımı
        const departmentSpend = await prisma.order.groupBy({
            by: ["companyId"], // Assuming companyId maps to departments in this simplified schema or related to request's department
            where: {
                tenantId: user.tenantId,
                createdAt: {
                    gte: new Date(`${year}-01-01`),
                    lte: new Date(`${year}-12-31`)
                }
            },
            _sum: { realizedTotal: true },
            _count: { id: true }
        });

        // 2. Kategori Bazlı Harcama (RFQ üzerinden)
        // RFQ -> RFQItem -> Category
        const categorySpend = await prisma.rFQItem.groupBy({
            by: ["categoryId"],
            where: {
                rfq: {
                    tenantId: user.tenantId,
                    createdAt: {
                        gte: new Date(`${year}-01-01`),
                        lte: new Date(`${year}-12-31`)
                    }
                }
            },
            _sum: { targetPrice: true } // This is target spend, ideally we'd join with finalized orders
        });

        // 3. Tasarruf Analizi (Savings)
        // RFQ Max Offer vs Final Order Price
        const rfqData = await prisma.rFQ.findMany({
            where: {
                tenantId: user.tenantId,
                status: { contains: "Finalize" }, // Only finalized
                createdAt: {
                    gte: new Date(`${year}-01-01`),
                    lte: new Date(`${year}-12-31`)
                }
            },
            include: {
                offers: true
            }
        });

        let totalSavings = 0;
        rfqData.forEach(rfq => {
            if (rfq.offers.length > 1) {
                const prices = rfq.offers.map(o => Number(o.totalAmount)).filter(p => p > 0);
                const max = Math.max(...prices);
                const min = Math.min(...prices);
                totalSavings += (max - min);
            }
        });

        // 4. Aylık Harcama Trendi
        const orders = await prisma.order.findMany({
            where: {
                tenantId: user.tenantId,
                createdAt: {
                    gte: new Date(`${year}-01-01`),
                    lte: new Date(`${year}-12-31`)
                }
            },
            select: { createdAt: true, realizedTotal: true }
        });

        const monthlyTrend = Array(12).fill(0);
        orders.forEach(o => {
            const m = new Date(o.createdAt).getMonth();
            monthlyTrend[m] += Number(o.realizedTotal || 0);
        });

        return NextResponse.json({
            year,
            departmentSpend,
            categorySpend,
            savings: {
                totalValue: totalSavings,
                percentage: 0 // Could calculate relative to total
            },
            monthlyTrend
        });

    } catch (e: any) {
        console.error("[Pivot API] Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}
