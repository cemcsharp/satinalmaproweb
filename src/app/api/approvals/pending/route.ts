import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthApi, getUserWithPermissions } from "@/lib/apiAuth";

// Kullanıcının onaylaması gereken talepleri getir
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuthApi(req);
        if (!auth) {
            return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
        }

        const user = await getUserWithPermissions(req);
        if (!user) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 401 });
        }

        const userRoleKey = user.roleRef?.key || user.role || "user";

        // Rol'e göre hangi durumları görebilir
        let statusFilter: string[] = [];

        if (userRoleKey === "admin") {
            // Admin tüm bekleyen onayları görür
            statusFilter = ["Taslak", "Birim Onayı Bekliyor", "Genel Müdür Onayı Bekliyor", "Satınalma Havuzunda"];
        } else if (userRoleKey === "birim_muduru") {
            statusFilter = ["Taslak", "Birim Onayı Bekliyor"];
        } else if (userRoleKey === "genel_mudur") {
            statusFilter = ["Genel Müdür Onayı Bekliyor"];
        } else if (userRoleKey === "satinalma_muduru") {
            statusFilter = ["Satınalma Havuzunda"];
        }

        if (statusFilter.length === 0) {
            return NextResponse.json({ pending: [], count: 0 });
        }

        // Bekleyen talepleri getir
        const pendingRequests = await prisma.request.findMany({
            where: {
                status: {
                    label: { in: statusFilter }
                },
                // Birim müdürü ise sadece kendi biriminin taleplerini görsün
                ...(userRoleKey === "birim_muduru" && user.unitId ? { unitId: user.unitId } : {})
            },
            include: {
                status: true,
                unit: true,
                owner: { select: { id: true, username: true } }
            },
            orderBy: { createdAt: "desc" },
            take: 10 // Son 10 talep
        });

        const mapped = pendingRequests.map(r => ({
            id: r.id,
            barcode: r.barcode,
            subject: r.subject,
            status: r.status?.label || "",
            unit: r.unit?.label || "",
            owner: r.owner?.username || "",
            date: r.createdAt.toISOString(),
            budget: Number(r.budget)
        }));

        return NextResponse.json({
            pending: mapped,
            count: mapped.length,
            userRole: userRoleKey
        });

    } catch (error) {
        console.error("[Pending Approvals] Error:", error);
        return NextResponse.json({ error: "Bekleyen onaylar alınamadı" }, { status: 500 });
    }
}
