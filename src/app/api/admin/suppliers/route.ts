import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionApi } from "@/lib/apiAuth";

// GET: List suppliers with optional status filter
export async function GET(req: NextRequest) {
    try {
        const authResult = await requirePermissionApi(req, "admin");
        if (!authResult) {
            return NextResponse.json({ error: "forbidden" }, { status: 403 });
        }

        const status = req.nextUrl.searchParams.get("status") || "all";

        const where: any = { isSupplier: true };
        if (status !== "all") {
            where.registrationStatus = status;
        }

        const suppliers = await prisma.tenant.findMany({
            where,
            include: {
                category: {
                    select: { name: true }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        // Map isActive to active for frontend compatibility
        const mappedSuppliers = suppliers.map(s => ({
            ...s,
            active: s.isActive
        }));

        return NextResponse.json({ ok: true, suppliers: mappedSuppliers });
    } catch (error) {
        console.error("Admin suppliers list error:", error);
        return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
}
