import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionApi } from "@/lib/apiAuth";

// GET: List suppliers with optional status filter
export async function GET(req: NextRequest) {
    try {
        const authResult = await requirePermissionApi(req, "admin");
        if (authResult instanceof NextResponse) return authResult;

        const status = req.nextUrl.searchParams.get("status") || "all";

        const where = status === "all"
            ? {}
            : { registrationStatus: status };

        const suppliers = await prisma.supplier.findMany({
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

        return NextResponse.json({ ok: true, suppliers });
    } catch (error) {
        console.error("Admin suppliers list error:", error);
        return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
}
