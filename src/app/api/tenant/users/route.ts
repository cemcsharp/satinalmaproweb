import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/apiAuth";

/**
 * Firmanın kendi kullanıcılarını listeler.
 */
export async function GET(req: NextRequest) {
    try {
        const user = await getSessionUser();
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
        }

        const users = await prisma.user.findMany({
            where: { tenantId: user.tenantId },
            include: {
                roleRef: {
                    select: { name: true, key: true }
                },
                department: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        // Bekleyen davetiyeleri de çekebiliriz
        const invitations = await prisma.invitation.findMany({
            where: {
                tenantId: user.tenantId,
                status: "pending"
            },
            include: {
                role: {
                    select: { name: true }
                }
            }
        });

        return NextResponse.json({
            users,
            invitations
        });
    } catch (error) {
        console.error("Firma kullanıcıları çekilirken hata:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
