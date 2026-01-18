import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { requirePermissionApi } from "@/lib/apiAuth";

/**
 * GET /api/finans/butce
 * Departman bazlı bütçe durumlarını listeler.
 */
export async function GET(req: NextRequest) {
    try {
        const user = await requirePermissionApi(req, "budget:view");
        if (!user) return jsonError(403, "forbidden");

        const budgets = await prisma.budget.findMany({
            where: user.isSuperAdmin ? {} : {
                department: {
                    tenantId: user.tenantId
                }
            },
            include: {
                department: {
                    select: { name: true }
                }
            },
            orderBy: [
                { year: "desc" },
                { department: { name: "asc" } }
            ]
        });

        // Format for dashboard
        const items = budgets.map(b => ({
            id: b.id,
            departmentName: b.department.name,
            year: b.year,
            total: Number(b.totalAmount),
            spent: Number(b.spentAmount),
            reserved: Number(b.reservedAmount),
            remaining: Number(b.totalAmount) - (Number(b.spentAmount) + Number(b.reservedAmount)),
            currency: b.currency,
            utilizationRate: ((Number(b.spentAmount) + Number(b.reservedAmount)) / Number(b.totalAmount)) * 100
        }));

        return NextResponse.json({ items });

    } catch (e: any) {
        console.error("[Budget API] Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}

/**
 * POST /api/finans/butce
 * Yeni bütçe tanımlama
 */
export async function POST(req: NextRequest) {
    try {
        const user = await requirePermissionApi(req, "budget:manage");
        if (!user) return jsonError(403, "forbidden");

        const body = await req.json();
        const { departmentId, year, totalAmount, currency } = body;

        if (!departmentId || !year || !totalAmount) {
            return jsonError(400, "missing_fields");
        }

        const newBudget = await prisma.budget.create({
            data: {
                departmentId,
                year: parseInt(year),
                totalAmount: parseFloat(totalAmount),
                currency: currency || "TRY",
                spentAmount: 0,
                reservedAmount: 0
            }
        });

        return NextResponse.json(newBudget);

    } catch (e: any) {
        console.error("[Budget Create] Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}
