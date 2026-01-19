import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureAdminApi } from "@/lib/apiAuth";

export async function GET(req: NextRequest) {
    try {
        // Check admin auth
        const user = await ensureAdminApi(req);
        if (!user) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        }
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") || "pending";

        // Query tenants with isSupplier: true instead of supplier model
        const suppliers = await prisma.tenant.findMany({
            where: {
                isSupplier: true,
                registrationStatus: status,
            },
            include: {
                category: true,
                users: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
                approvedBy: {
                    select: {
                        id: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(suppliers);
    } catch (error: any) {
        if (error?.message?.includes("Forbidden") || error?.message?.includes("Unauthorized")) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        }
        console.error("Pending suppliers error:", error);
        return NextResponse.json({ error: "Liste alınırken hata oluştu" }, { status: 500 });
    }
}
