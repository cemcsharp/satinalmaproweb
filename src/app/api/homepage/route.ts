import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthApi } from "@/lib/apiAuth";

// Kullanıcıya özel anasayfa verileri - TAM ROL BAZLI SİSTEM
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuthApi(req);
        if (!auth) {
            return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
        }

        const userId = String(auth.userId);

        // Kullanıcı bilgilerini tam olarak al
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                roleRef: true,
                unit: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 401 });
        }

        const userRoleKey = user.roleRef?.key || user.role || "user";
        const userUnitId = user.unitId;

        // Veri yapıları
        let pendingApprovals: any[] = [];
        let myRequests: any[] = [];
        let myOrders: any[] = [];
        let recentActivity: any[] = [];
        let stats: Record<string, number> = {};

        // =============================================
        // 1. BEKLEYEN ONAYLAR (Role göre)
        // =============================================
        try {
            if (userRoleKey === "admin") {
                pendingApprovals = await prisma.request.findMany({
                    where: {
                        status: { label: { contains: "Bekliyor", mode: "insensitive" } }
                    },
                    include: {
                        status: true,
                        unit: true,
                        owner: { select: { username: true } }
                    },
                    orderBy: { createdAt: "desc" },
                    take: 5
                });
            } else if (userRoleKey === "birim_muduru" && userUnitId) {
                pendingApprovals = await prisma.request.findMany({
                    where: {
                        unitId: userUnitId,
                        status: { label: { contains: "Birim", mode: "insensitive" } }
                    },
                    include: {
                        status: true,
                        unit: true,
                        owner: { select: { username: true } }
                    },
                    orderBy: { createdAt: "desc" },
                    take: 5
                });
            } else if (userRoleKey === "genel_mudur") {
                pendingApprovals = await prisma.request.findMany({
                    where: {
                        status: { label: { contains: "Genel", mode: "insensitive" } }
                    },
                    include: {
                        status: true,
                        unit: true,
                        owner: { select: { username: true } }
                    },
                    orderBy: { createdAt: "desc" },
                    take: 5
                });
            } else if (userRoleKey === "satinalma_muduru") {
                pendingApprovals = await prisma.request.findMany({
                    where: {
                        status: { label: { contains: "Havuz", mode: "insensitive" } }
                    },
                    include: {
                        status: true,
                        unit: true,
                        owner: { select: { username: true } }
                    },
                    orderBy: { createdAt: "desc" },
                    take: 5
                });
            }
        } catch (e) {
            console.error("[Homepage] pendingApprovals error:", e);
        }

        // =============================================
        // 2. KENDİ TALEPLERİM (Herkes)
        // =============================================
        try {
            myRequests = await prisma.request.findMany({
                where: { ownerUserId: userId },
                include: { status: true },
                orderBy: { createdAt: "desc" },
                take: 5
            });
        } catch (e) {
            console.error("[Homepage] myRequests error:", e);
        }

        // =============================================
        // 3. SİPARİŞLER (Satınalma rolleri için)
        // =============================================
        try {
            if (["admin", "satinalma_muduru", "satinalma_personeli"].includes(userRoleKey)) {
                myOrders = await prisma.order.findMany({
                    include: {
                        status: true,
                        supplier: { select: { name: true } }
                    },
                    orderBy: { createdAt: "desc" },
                    take: 5
                });
            }
        } catch (e) {
            console.error("[Homepage] myOrders error:", e);
        }

        // =============================================
        // 4. SON AKTİVİTELER
        // =============================================
        try {
            recentActivity = await prisma.comment.findMany({
                where: { authorId: userId },
                include: {
                    author: { select: { username: true } },
                    request: { select: { barcode: true, subject: true } }
                },
                orderBy: { createdAt: "desc" },
                take: 8
            });
        } catch (e) {
            console.error("[Homepage] recentActivity error:", e);
        }

        // =============================================
        // 5. İSTATİSTİKLER (Role göre farklı metrikler)
        // =============================================
        try {
            if (userRoleKey === "admin") {
                stats = {
                    totalRequests: await prisma.request.count(),
                    totalOrders: await prisma.order.count(),
                    pendingApprovals: await prisma.request.count({
                        where: { status: { label: { contains: "Bekliyor", mode: "insensitive" } } }
                    }),
                    activeSuppliers: await prisma.supplier.count({ where: { active: true } })
                };
            } else if (["satinalma_muduru", "satinalma_personeli"].includes(userRoleKey)) {
                stats = {
                    poolRequests: await prisma.request.count({
                        where: { status: { label: { contains: "Havuz", mode: "insensitive" } } }
                    }),
                    totalOrders: await prisma.order.count(),
                    pendingDeliveries: await prisma.order.count({
                        where: { status: { label: { contains: "Bekliyor", mode: "insensitive" } } }
                    })
                };
            } else if (userRoleKey === "birim_muduru" && userUnitId) {
                stats = {
                    pendingApprovals: await prisma.request.count({
                        where: {
                            unitId: userUnitId,
                            status: { label: { contains: "Birim", mode: "insensitive" } }
                        }
                    }),
                    unitRequests: await prisma.request.count({
                        where: { unitId: userUnitId }
                    })
                };
            } else {
                // Birim personeli / standart kullanıcı
                stats = {
                    myRequests: await prisma.request.count({ where: { ownerUserId: userId } }),
                    approvedRequests: await prisma.request.count({
                        where: {
                            ownerUserId: userId,
                            status: { label: { contains: "Onay", mode: "insensitive" } }
                        }
                    })
                };
            }
        } catch (e) {
            console.error("[Homepage] stats error:", e);
            stats = { myRequests: 0 };
        }

        // =============================================
        // 6. KRİTİK UYARILAR (Admin & Satınalma için)
        // =============================================
        let criticalAlerts: any[] = [];
        try {
            if (["admin", "satinalma_muduru", "satinalma_personeli"].includes(userRoleKey)) {
                const today = new Date();
                const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

                // Süresi yaklaşan/geçen sözleşmeler
                const expiringContracts = await prisma.contract.findMany({
                    where: {
                        endDate: { lte: thirtyDaysFromNow }
                    },
                    select: {
                        id: true,
                        contractNumber: true,
                        title: true,
                        endDate: true,
                        supplier: { select: { name: true } }
                    },
                    orderBy: { endDate: "asc" },
                    take: 5
                });

                for (const c of expiringContracts) {
                    const isExpired = c.endDate && new Date(c.endDate) < today;
                    criticalAlerts.push({
                        type: isExpired ? "danger" : "warning",
                        icon: "📄",
                        title: isExpired ? "Sözleşme Süresi Doldu" : "Sözleşme Süresi Yaklaşıyor",
                        message: `${c.contractNumber} - ${c.supplier?.name || "Tedarikçi"}`,
                        date: c.endDate,
                        link: `/sozlesme/detay/${c.id}`
                    });
                }

                // Bekleyen teslimatlar (gecikenler)
                const overdueOrders = await prisma.order.findMany({
                    where: {
                        deliveryDate: { lt: today },
                        status: { label: { not: { contains: "Teslim", mode: "insensitive" } } }
                    },
                    select: {
                        id: true,
                        orderNumber: true,
                        deliveryDate: true,
                        supplier: { select: { name: true } }
                    },
                    orderBy: { deliveryDate: "asc" },
                    take: 5
                });

                for (const o of overdueOrders) {
                    criticalAlerts.push({
                        type: "danger",
                        icon: "📦",
                        title: "Teslimat Gecikti",
                        message: `${o.orderNumber} - ${o.supplier?.name || "Tedarikçi"}`,
                        date: o.deliveryDate,
                        link: `/siparis/detay/${o.id}`
                    });
                }
            }
        } catch (e) {
            console.error("[Homepage] criticalAlerts error:", e);
        }

        // =============================================
        // 7. TESLİMAT TAKVİMİ (Yaklaşan teslimatlar)
        // =============================================
        let upcomingDeliveries: any[] = [];
        try {
            if (["admin", "satinalma_muduru", "satinalma_personeli"].includes(userRoleKey)) {
                const today = new Date();
                const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

                upcomingDeliveries = await prisma.order.findMany({
                    where: {
                        deliveryDate: {
                            gte: today,
                            lte: thirtyDaysFromNow
                        },
                        status: { label: { not: { contains: "Teslim", mode: "insensitive" } } }
                    },
                    select: {
                        id: true,
                        orderNumber: true,
                        deliveryDate: true,
                        supplier: { select: { name: true } },
                        status: { select: { label: true } }
                    },
                    orderBy: { deliveryDate: "asc" },
                    take: 10
                });
            }
        } catch (e) {
            console.error("[Homepage] upcomingDeliveries error:", e);
        }

        // =============================================
        // 8. ÖNEMLİ TARİHLER (Takvim)
        // =============================================
        let importantDates: any[] = [];
        try {
            const today = new Date();
            const sixtyDaysFromNow = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

            // Sözleşme bitiş tarihleri
            const contractDates = await prisma.contract.findMany({
                where: {
                    endDate: {
                        gte: today,
                        lte: sixtyDaysFromNow
                    }
                },
                select: {
                    id: true,
                    contractNumber: true,
                    title: true,
                    endDate: true
                },
                orderBy: { endDate: "asc" },
                take: 5
            });

            for (const c of contractDates) {
                importantDates.push({
                    type: "contract",
                    icon: "📄",
                    title: "Sözleşme Bitiş",
                    description: c.contractNumber,
                    date: c.endDate,
                    link: `/sozlesme/detay/${c.id}`
                });
            }

            // Teslimat tarihleri (herkes için kendi talepleri)
            if (["admin", "satinalma_muduru", "satinalma_personeli"].includes(userRoleKey)) {
                for (const d of upcomingDeliveries.slice(0, 5)) {
                    importantDates.push({
                        type: "delivery",
                        icon: "📦",
                        title: "Teslimat",
                        description: `${d.orderNumber} - ${d.supplier?.name}`,
                        date: d.deliveryDate,
                        link: `/siparis/detay/${d.id}`
                    });
                }
            }

            // Tarihe göre sırala
            importantDates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        } catch (e) {
            console.error("[Homepage] importantDates error:", e);
        }

        // =============================================
        // 9. GECİKEN ONAYLAR (SLA) - Admin & Yöneticiler
        // =============================================
        let overdueApprovals: any[] = [];
        try {
            if (["admin", "genel_mudur"].includes(userRoleKey) || userRoleKey.includes("mudur")) {
                const today = new Date();
                overdueApprovals = await prisma.request.findMany({
                    where: {
                        approvalDeadline: { lt: today },
                        status: {
                            label: {
                                notIn: ["Tamamlandı", "Reddedildi", "İptal Edildi", "Sipariş Oluşturuldu"]
                            }
                        }
                    },
                    select: {
                        id: true,
                        barcode: true,
                        subject: true,
                        approvalDeadline: true,
                        owner: { select: { username: true } },
                        status: { select: { label: true } }
                    },
                    orderBy: { approvalDeadline: "asc" },
                    take: 5
                });
            }
        } catch (e) {
            console.error("[Homepage] overdueApprovals error:", e);
        }

        // =============================================
        // RESPONSE
        // =============================================
        return NextResponse.json({
            user: {
                id: userId,
                username: user.username,
                role: userRoleKey,
                roleName: user.roleRef?.name || user.role,
                unit: user.unit?.label
            },
            pendingApprovals: pendingApprovals.map(r => ({
                id: r.id,
                barcode: r.barcode,
                subject: r.subject,
                status: r.status?.label,
                unit: r.unit?.label,
                owner: r.owner?.username,
                date: r.createdAt
            })),
            myRequests: myRequests.map(r => ({
                id: r.id,
                barcode: r.barcode,
                subject: r.subject,
                status: r.status?.label,
                date: r.createdAt
            })),
            myOrders: myOrders.map(o => ({
                id: o.id,
                orderNumber: o.orderNumber,
                status: o.status?.label,
                supplier: o.supplier?.name,
                date: o.createdAt
            })),
            recentActivity: recentActivity.map(a => ({
                id: a.id,
                text: a.text,
                author: a.author?.username,
                request: a.request?.barcode,
                date: a.createdAt
            })),
            stats,
            criticalAlerts,
            upcomingDeliveries: upcomingDeliveries.map(d => ({
                id: d.id,
                orderNumber: d.orderNumber,
                supplier: d.supplier?.name,
                date: d.deliveryDate,
                status: d.status?.label
            })),
            overdueApprovals: overdueApprovals.map(r => ({
                id: r.id,
                barcode: r.barcode,
                subject: r.subject,
                owner: r.owner?.username,
                deadline: r.approvalDeadline,
                status: r.status?.label
            })),
            importantDates
        });

    } catch (error: any) {
        console.error("[Homepage Data] Error:", error);
        return NextResponse.json({
            error: "Veri alınamadı",
            message: error?.message || String(error)
        }, { status: 500 });
    }
}

