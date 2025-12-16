import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthApi, getUserWithPermissions } from "@/lib/apiAuth";
import { notifyAndPublish } from "@/lib/notification-service";

// Talep İptal/Geri Çekme API endpoint'i
// POST: Talebi iptal et veya geri çek
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireAuthApi(req);
        if (!auth) {
            return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { reason } = body;

        const userId = String(auth.userId);

        // Talebi bul
        const request = await prisma.request.findUnique({
            where: { id },
            include: {
                status: true,
                owner: true,
                responsible: true,
                unit: true
            }
        });

        if (!request) {
            return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
        }

        // Kullanıcı kontrolü - sadece talep sahibi veya admin iptal edebilir
        const user = await getUserWithPermissions(req);
        const isOwner = request.ownerUserId === userId;
        const isAdmin = user?.role === "admin" || user?.roleRef?.key === "admin";

        if (!isOwner && !isAdmin) {
            return NextResponse.json(
                { error: "Bu talebi sadece talep sahibi veya admin iptal edebilir" },
                { status: 403 }
            );
        }

        // Durum kontrolü - sadece belirli durumlarda iptal edilebilir
        const currentStatus = request.status?.label?.toLowerCase() || "";
        const canCancel = [
            "taslak",
            "bekliyor",
            "onay",
            "birim",
            "genel müdür"
        ].some(s => currentStatus.includes(s));

        // İşlemde veya tamamlanmış talepler iptal edilemez
        const cantCancel = [
            "işlemde",
            "sipariş",
            "tamamlandı",
            "onaylandı",
            "reddedildi",
            "iptal"
        ].some(s => currentStatus.includes(s));

        if (cantCancel || !canCancel) {
            return NextResponse.json(
                { error: `Bu durumdaki talep iptal edilemez: ${request.status?.label}` },
                { status: 400 }
            );
        }

        // İptal durumunu bul veya oluştur
        let cancelStatus = await prisma.optionItem.findFirst({
            where: { label: { contains: "İptal", mode: "insensitive" } }
        });

        if (!cancelStatus) {
            // Durum kategorisini bul
            const statusCategory = await prisma.optionCategory.findFirst({
                where: { key: "durum" }
            });

            if (statusCategory) {
                cancelStatus = await prisma.optionItem.create({
                    data: {
                        label: "İptal Edildi",
                        categoryId: statusCategory.id,
                        active: true,
                        sort: 99
                    }
                });
            }
        }

        if (!cancelStatus) {
            return NextResponse.json({ error: "İptal durumu oluşturulamadı" }, { status: 500 });
        }

        // Talebi güncelle
        const updatedRequest = await prisma.request.update({
            where: { id },
            data: {
                statusId: cancelStatus.id
            },
            include: {
                status: true,
                owner: true
            }
        });

        // Yorum olarak iptal kaydı ekle
        await prisma.comment.create({
            data: {
                requestId: id,
                authorId: userId,
                text: `[İPTAL] Talep iptal edildi. ${reason ? `Sebep: ${reason}` : ""}`
            }
        });

        // Bildirimleri gönder
        const notifyUserIds = [
            request.ownerUserId,
            request.responsibleUserId
        ].filter(Boolean) as string[];

        // Talep sahibi değilse ona bildir
        if (!isOwner && request.ownerUserId) {
            await notifyAndPublish({
                userId: request.ownerUserId,
                title: "Talep İptal Edildi",
                body: `${request.barcode} - ${request.subject} talebi iptal edildi.`,
                type: "warning",
                link: `/talep/detay/${id}`
            });
        }

        // Atanmış sorumlu varsa ona bildir
        if (request.responsibleUserId && request.responsibleUserId !== userId) {
            await notifyAndPublish({
                userId: request.responsibleUserId,
                title: "Talep İptal Edildi",
                body: `${request.barcode} - ${request.subject} talebi iptal edildi.`,
                type: "warning",
                link: `/talep/detay/${id}`
            });
        }

        return NextResponse.json({
            message: "Talep başarıyla iptal edildi",
            request: updatedRequest
        });

    } catch (error) {
        console.error("[Request Cancel] Error:", error);
        return NextResponse.json({ error: "İşlem başarısız" }, { status: 500 });
    }
}
