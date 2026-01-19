import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionApi } from "@/lib/apiAuth";

// GET: List all companies (buyers)
export async function GET(req: NextRequest) {
    try {
        const authResult = await requirePermissionApi(req, "admin");
        if (!authResult) {
            return NextResponse.json({ error: "forbidden" }, { status: 403 });
        }

        const companies = await prisma.tenant.findMany({
            where: { isBuyer: true },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                taxId: true,
                isActive: true, // renamed from active
                plan: true,
                planExpiresAt: true,
                _count: {
                    select: { buyerOrders: true } // renamed from orders
                }
            },
            orderBy: { name: "asc" }
        });

        // Map isActive back to active for frontend compatibility if needed
        const mappedCompanies = companies.map(c => ({
            ...c,
            active: c.isActive
        }));

        return NextResponse.json({ ok: true, companies: mappedCompanies });
    } catch (error) {
        console.error("Admin companies list error:", error);
        return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
}
