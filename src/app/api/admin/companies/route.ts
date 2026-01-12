import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionApi } from "@/lib/apiAuth";

// GET: List all companies (buyers)
export async function GET(req: NextRequest) {
    try {
        const authResult = await requirePermissionApi(req, "admin");
        if (authResult instanceof NextResponse) return authResult;

        const companies = await prisma.company.findMany({
            include: {
                _count: {
                    select: { orders: true }
                }
            },
            orderBy: { name: "asc" }
        });

        return NextResponse.json({ ok: true, companies });
    } catch (error) {
        console.error("Admin companies list error:", error);
        return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
}
