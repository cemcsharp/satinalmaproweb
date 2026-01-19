import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionApi } from "@/lib/apiAuth";

// GET: Admin dashboard statistics
export async function GET(req: NextRequest) {
    try {
        const authResult = await requirePermissionApi(req, "admin");
        if (authResult instanceof NextResponse) return authResult;

        // Get counts in parallel (using Tenant model for suppliers)
        const [
            totalUsers,
            activeUsers,
            totalSuppliers,
            pendingSuppliers,
            approvedSuppliers,
            totalRfqs,
            openRfqs,
            totalOffers,
            totalOrders
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { isActive: true } }),
            prisma.tenant.count({ where: { isSupplier: true } }),
            prisma.tenant.count({ where: { isSupplier: true, registrationStatus: "pending" } }),
            prisma.tenant.count({ where: { isSupplier: true, registrationStatus: "approved" } }),
            prisma.rfq.count(),
            prisma.rfq.count({ where: { status: "OPEN" } }),
            prisma.rfqOffer.count(),
            prisma.order.count()
        ]);

        // Get recent pending supplier registrations (from Tenant model)
        const recentSuppliers = await prisma.tenant.findMany({
            where: { isSupplier: true, registrationStatus: "pending" },
            take: 5,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true
            }
        });

        const recentRfqs = await prisma.rfq.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                rfxCode: true,
                title: true,
                status: true,
                createdAt: true
            }
        });

        return NextResponse.json({
            ok: true,
            stats: {
                users: {
                    total: totalUsers,
                    active: activeUsers
                },
                suppliers: {
                    total: totalSuppliers,
                    pending: pendingSuppliers,
                    approved: approvedSuppliers
                },
                rfqs: {
                    total: totalRfqs,
                    open: openRfqs
                },
                offers: totalOffers,
                orders: totalOrders
            },
            recent: {
                pendingSuppliers: recentSuppliers,
                rfqs: recentRfqs
            }
        });
    } catch (error) {
        console.error("Admin stats error:", error);
        return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
}
