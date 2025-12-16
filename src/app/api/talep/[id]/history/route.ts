import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthApi } from "@/lib/apiAuth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAuthApi(req);
        if (!auth) {
            return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
        }

        const { id } = await params;

        const history = await prisma.requestRevision.findMany({
            where: { requestId: id },
            include: {
                user: {
                    select: {
                        username: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(history);
    } catch (error) {
        console.error("[History API] Error:", error);
        return NextResponse.json({ error: "Geçmiş alınamadı" }, { status: 500 });
    }
}
