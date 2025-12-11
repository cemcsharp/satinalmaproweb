import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { jsonError } from "@/lib/apiError";

// GET - Dashboard statistics
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return jsonError(401, "unauthorized");

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Parallel queries for performance
        const [
            totalRequests,
            pendingRequests,
            totalOrders,
            pendingOrders,
            thisMonthRequests,
            lastMonthRequests,
            thisMonthOrders,
            lastMonthOrders,
            recentRequests,
            recentOrders,
            totalSuppliers,
            totalContracts,
        ] = await Promise.all([
            prisma.request.count(),
            prisma.request.count({ where: { status: { in: ["Beklemede", "Pending"] } } }),
            prisma.order.count(),
            prisma.order.count({ where: { status: { in: ["Beklemede", "Pending", "Hazırlanıyor"] } } }),
            prisma.request.count({ where: { createdAt: { gte: startOfMonth } } }),
            prisma.request.count({ where: { createdAt: { gte: startOfLastMonth, lt: endOfLastMonth } } }),
            prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
            prisma.order.count({ where: { createdAt: { gte: startOfLastMonth, lt: endOfLastMonth } } }),
            prisma.request.findMany({
                take: 5,
                orderBy: { createdAt: "desc" },
                select: { id: true, title: true, status: true, createdAt: true }
            }),
            prisma.order.findMany({
                take: 5,
                orderBy: { createdAt: "desc" },
                select: { id: true, poNumber: true, status: true, createdAt: true }
            }),
            prisma.optionItem.count({ where: { category: { key: "tedarikci" } } }),
            prisma.contract.count(),
        ]);

        // Calculate trends (percentage change)
        const requestTrend = lastMonthRequests > 0
            ? Math.round(((thisMonthRequests - lastMonthRequests) / lastMonthRequests) * 100)
            : 0;
        const orderTrend = lastMonthOrders > 0
            ? Math.round(((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100)
            : 0;

        return NextResponse.json({
            summary: {
                requests: {
                    total: totalRequests,
                    pending: pendingRequests,
                    thisMonth: thisMonthRequests,
                    trend: requestTrend,
                },
                orders: {
                    total: totalOrders,
                    pending: pendingOrders,
                    thisMonth: thisMonthOrders,
                    trend: orderTrend,
                },
                suppliers: totalSuppliers,
                contracts: totalContracts,
            },
            recent: {
                requests: recentRequests,
                orders: recentOrders,
            },
        });
    } catch (e) {
        console.error("[Dashboard Stats API]", e);
        return jsonError(500, "server_error");
    }
}
