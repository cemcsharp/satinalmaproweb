import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateWhere: any = {};
    if (startDate || endDate) {
        dateWhere.createdAt = {};
        if (startDate) dateWhere.createdAt.gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateWhere.createdAt.lte = end;
        }
    }

    try {
        if (type === "talep") {
            const [total, open, completed, byUnit, byPerson, trend] = await Promise.all([
                prisma.request.count({ where: dateWhere }),
                prisma.request.count({ where: { ...dateWhere, status: { label: { notIn: ["Tamamlandı", "İptal Edildi"] } } } }),
                prisma.request.count({ where: { ...dateWhere, status: { label: "Tamamlandı" } } }),
                prisma.request.groupBy({ by: ["unitId"], _count: { _all: true }, where: dateWhere }),
                prisma.request.groupBy({ by: ["ownerUserId"], _count: { _all: true }, where: dateWhere }),
                prisma.request.groupBy({ by: ["createdAt"], _count: { _all: true }, where: dateWhere }),
            ]);

            // Fetch labels
            const unitIds = byUnit.map(g => g.unitId).filter(Boolean);
            const userIds = byPerson.map(g => g.ownerUserId).filter(Boolean);

            const [units, users] = await Promise.all([
                prisma.optionItem.findMany({ where: { id: { in: unitIds } } }),
                prisma.user.findMany({ where: { id: { in: userIds as string[] } } }),
            ]);

            const unitMap = new Map(units.map(u => [u.id, u.label]));
            const userMap = new Map(users.map(u => [u.id, u.username || u.email || "Bilinmiyor"]));

            // Trend logic
            const trendMap = new Map<string, number>();
            // If date filter is applied, we might want to show trend within that range. 
            // But groupBy createdAt returns distinct timestamps. We need to fetch and aggregate if we want monthly.
            // For performance, if date range is small, fetching all might be ok. If large, groupBy is better but needs DB specific truncation.
            // Reverting to findMany for manual aggregation as per previous logic, but filtered.
            const recentRequests = await prisma.request.findMany({
                where: dateWhere,
                select: { createdAt: true }
            });

            recentRequests.forEach(r => {
                const key = r.createdAt.toISOString().slice(0, 7); // YYYY-MM
                trendMap.set(key, (trendMap.get(key) || 0) + 1);
            });
            const trendData = Array.from(trendMap.entries())
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => a.date.localeCompare(b.date));

            return NextResponse.json({
                summary: { total, open, completed },
                byUnit: byUnit.map(g => ({ name: unitMap.get(g.unitId) || "Diğer", count: g._count._all })).sort((a, b) => b.count - a.count),
                byPerson: byPerson.map(g => ({ name: userMap.get(g.ownerUserId as string) || "Diğer", count: g._count._all })).sort((a, b) => b.count - a.count),
                trend: trendData
            });
        }

        if (type === "siparis") {
            const [total, totalAmountAgg, byMethod, byUnitSpendRaw, trendRaw] = await Promise.all([
                prisma.order.count({ where: dateWhere }),
                prisma.order.aggregate({ _sum: { realizedTotal: true }, where: dateWhere }),
                prisma.order.groupBy({ by: ["methodId"], _count: { _all: true }, _sum: { realizedTotal: true }, where: dateWhere }),
                prisma.order.findMany({
                    select: { realizedTotal: true, request: { select: { unitId: true, budget: true } } },
                    where: { ...dateWhere, realizedTotal: { gt: 0 } }
                }),
                prisma.order.findMany({
                    where: dateWhere,
                    select: { createdAt: true, realizedTotal: true }
                })
            ]);

            const methodIds = byMethod.map(g => g.methodId).filter(Boolean);
            const methods = await prisma.optionItem.findMany({ where: { id: { in: methodIds } } });
            const methodMap = new Map(methods.map(m => [m.id, m.label]));

            // Unit Spend Aggregation
            const unitSpendMap = new Map<string, { amount: number, budget: number }>();
            byUnitSpendRaw.forEach(o => {
                const unitId = o.request?.unitId;
                if (unitId) {
                    const curr = unitSpendMap.get(unitId) || { amount: 0, budget: 0 };
                    curr.amount += Number(o.realizedTotal || 0);
                    curr.budget += Number(o.request?.budget || 0);
                    unitSpendMap.set(unitId, curr);
                }
            });

            const unitIds = Array.from(unitSpendMap.keys());
            const units = await prisma.optionItem.findMany({ where: { id: { in: unitIds } } });
            const unitLabelMap = new Map(units.map(u => [u.id, u.label]));

            const byUnitSpend = Array.from(unitSpendMap.entries()).map(([id, val]) => ({
                name: unitLabelMap.get(id) || "Diğer",
                amount: val.amount,
                budget: val.budget
            })).sort((a, b) => b.amount - a.amount);

            // Trend
            const trendMap = new Map<string, number>();
            trendRaw.forEach(o => {
                const key = o.createdAt.toISOString().slice(0, 7);
                trendMap.set(key, (trendMap.get(key) || 0) + Number(o.realizedTotal || 0));
            });
            const trend = Array.from(trendMap.entries()).map(([date, amount]) => ({ date, amount })).sort((a, b) => a.date.localeCompare(b.date));

            return NextResponse.json({
                summary: {
                    total,
                    totalAmount: Number(totalAmountAgg._sum.realizedTotal || 0),
                    budgetGap: 0
                },
                byMethod: byMethod.map(g => ({
                    name: methodMap.get(g.methodId) || "Diğer",
                    count: g._count._all,
                    amount: Number(g._sum.realizedTotal || 0)
                })),
                byUnitSpend,
                trend
            });
        }

        if (type === "sozlesme") {
            const now = new Date();
            const [total, active, ended, expiringListRaw] = await Promise.all([
                prisma.contract.count({ where: dateWhere }),
                prisma.contract.count({ where: { ...dateWhere, status: "Aktif" } }),
                prisma.contract.count({ where: { ...dateWhere, status: { in: ["Sonlanmış", "İptal"] } } }),
                prisma.contract.findMany({
                    where: { ...dateWhere, endDate: { gt: now, lte: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) } },
                    include: { order: { include: { request: { include: { unit: true } } } } },
                    take: 10,
                    orderBy: { endDate: 'asc' }
                })
            ]);

            const allContracts = await prisma.contract.findMany({
                where: dateWhere,
                select: { id: true, order: { select: { request: { select: { unit: true } } } } }
            });
            const unitCountMap = new Map<string, number>();
            allContracts.forEach(c => {
                const unitName = c.order?.request?.unit?.label || "Diğer";
                unitCountMap.set(unitName, (unitCountMap.get(unitName) || 0) + 1);
            });
            const byUnit = Array.from(unitCountMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

            return NextResponse.json({
                summary: { total, active, ended, expiringSoon: expiringListRaw.length },
                byUnit,
                expiringList: expiringListRaw.map(c => ({
                    name: c.title,
                    date: c.endDate?.toISOString().slice(0, 10),
                    unit: c.order?.request?.unit?.label || "-"
                }))
            });
        }

        if (type === "fatura") {
            const [total, paid, unpaid, totalAmountAgg, bySupplierRaw, trendRaw] = await Promise.all([
                prisma.invoice.count({ where: dateWhere }),
                prisma.invoice.count({ where: { ...dateWhere, status: "Ödenmiş" } }),
                prisma.invoice.count({ where: { ...dateWhere, status: { not: "Ödenmiş" } } }),
                prisma.invoice.aggregate({ _sum: { amount: true }, where: dateWhere }),
                prisma.invoice.findMany({
                    where: dateWhere,
                    include: { order: { include: { supplier: true } } }
                }),
                prisma.invoice.findMany({
                    where: dateWhere,
                    select: { createdAt: true, status: true, amount: true }
                })
            ]);

            // By Supplier
            const supplierMap = new Map<string, number>();
            bySupplierRaw.forEach(inv => {
                const name = inv.order?.supplier?.name || "Diğer";
                supplierMap.set(name, (supplierMap.get(name) || 0) + Number(inv.amount || 0));
            });
            const bySupplier = Array.from(supplierMap.entries())
                .map(([name, amount]) => ({ name, amount }))
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 10);

            // Status Trend
            const trendMap = new Map<string, { paid: number, unpaid: number }>();
            trendRaw.forEach(inv => {
                const key = inv.createdAt.toISOString().slice(0, 7);
                const curr = trendMap.get(key) || { paid: 0, unpaid: 0 };
                if (inv.status === "Ödenmiş") curr.paid += Number(inv.amount || 0);
                else curr.unpaid += Number(inv.amount || 0);
                trendMap.set(key, curr);
            });
            const statusTrend = Array.from(trendMap.entries())
                .map(([date, val]) => ({ date, ...val }))
                .sort((a, b) => a.date.localeCompare(b.date));

            return NextResponse.json({
                summary: {
                    total,
                    paid,
                    unpaid,
                    totalAmount: Number(totalAmountAgg._sum.amount || 0)
                },
                bySupplier,
                statusTrend
            });
        }

        if (type === "degerlendirme") {
            const evalDateWhere: any = {};
            if (startDate || endDate) {
                evalDateWhere.submittedAt = {};
                if (startDate) evalDateWhere.submittedAt.gte = new Date(startDate);
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    evalDateWhere.submittedAt.lte = end;
                }
            }

            const evals = await prisma.supplierEvaluation.findMany({
                where: evalDateWhere,
                include: { supplier: true }
            });

            const total = evals.length;
            const avgScore = total > 0
                ? evals.reduce((acc, e) => acc + Number(e.totalScore || 0), 0) / total
                : 0;

            // Score ranges
            const ranges = {
                "Mükemmel (90-100)": 0,
                "İyi (75-89)": 0,
                "Orta (60-74)": 0,
                "Zayıf (40-59)": 0,
                "Kabul Edilemez (0-39)": 0
            };

            evals.forEach(e => {
                const s = Number(e.totalScore || 0);
                if (s >= 90) ranges["Mükemmel (90-100)"]++;
                else if (s >= 75) ranges["İyi (75-89)"]++;
                else if (s >= 60) ranges["Orta (60-74)"]++;
                else if (s >= 40) ranges["Zayıf (40-59)"]++;
                else ranges["Kabul Edilemez (0-39)"]++;
            });

            const byScore = Object.entries(ranges).map(([range, count]) => ({
                range,
                count,
                label: range.split(" ")[0] // Simple label
            }));

            // Actions (Mock logic based on scores)
            const actions = [
                { type: "Yüksek Öncelikli Çalışmaya Devam", count: ranges["Mükemmel (90-100)"], color: "text-emerald-600" },
                { type: "Takip Edilerek Çalışmaya Devam", count: ranges["İyi (75-89)"], color: "text-blue-600" },
                { type: "İyileştirme Planı Talep Edilmeli", count: ranges["Orta (60-74)"], color: "text-amber-600" },
                { type: "Alternatif Araştırılmalı", count: ranges["Zayıf (40-59)"], color: "text-orange-600" },
                { type: "İlişki Sonlandırılmalı", count: ranges["Kabul Edilemez (0-39)"], color: "text-red-600" },
            ].filter(a => a.count > 0);

            // Mocking criteria and recent evaluations as they are not standard in the model yet or just reusing evals
            // Assuming criteria is not easily extractable without a separate table, mocking for now or using a placeholder
            const byCriteria = [
                { criteria: "Kalite", score: avgScore },
                { criteria: "Termin", score: avgScore > 5 ? avgScore - 5 : 0 },
                { criteria: "Fiyat", score: avgScore < 95 ? avgScore + 5 : 100 },
                { criteria: "İletişim", score: avgScore },
                { criteria: "Esneklik", score: avgScore }
            ];

            const recentEvaluations = evals
                .filter(e => e.submittedAt) // Ensure submittedAt exists
                .sort((a, b) => (b.submittedAt?.getTime() || 0) - (a.submittedAt?.getTime() || 0))
                .slice(0, 5)
                .map(e => ({
                    supplier: e.supplier?.name || "Bilinmiyor",
                    date: e.submittedAt?.toISOString().slice(0, 10) || "-",
                    score: Number(e.totalScore || 0)
                }));

            return NextResponse.json({
                summary: { total, avgScore: Math.round(avgScore) },
                byScore,
                actions,
                byCriteria,
                recentEvaluations
            });
        }

        return NextResponse.json({ error: "Invalid type" }, { status: 400 });

    } catch (error: any) {
        console.error("Report API Error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
