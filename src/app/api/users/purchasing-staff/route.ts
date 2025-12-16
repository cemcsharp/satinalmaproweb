import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthApi } from "@/lib/apiAuth";

// Satınalma departmanı personelini listele
// Talep atama için kullanılır
export async function GET(req: Request) {
    try {
        const auth = await requireAuthApi(req as any);

        if (!auth) {
            return NextResponse.json(
                { error: "Oturum açmanız gerekiyor" },
                { status: 401 }
            );
        }

        // Satınalma ile ilgili rol key'leri
        const purchasingRoleKeys = [
            "admin",
            "satinalma_muduru",
            "satinalma_personeli",
            "satinalma_uzmani" // Eski rol de dahil
        ];

        // Bu rollere sahip kullanıcıları getir
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    // Yeni sistem: roleRef ile ilişkilendirilmiş
                    { roleRef: { key: { in: purchasingRoleKeys } } },
                    // Eski sistem: role string alanında
                    { role: { in: ["admin", "satinalma"] } },
                ]
            },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                roleRef: {
                    select: {
                        id: true,
                        name: true,
                        key: true
                    }
                },
                unit: {
                    select: {
                        id: true,
                        value: true
                    }
                }
            },
            orderBy: { username: "asc" }
        });

        return NextResponse.json(users);

    } catch (error) {
        console.error("[Purchasing Staff] Error:", error);
        return NextResponse.json(
            { error: "Personel listesi alınamadı" },
            { status: 500 }
        );
    }
}
