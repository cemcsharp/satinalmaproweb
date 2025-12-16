import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthApi } from "@/lib/apiAuth";
import { notifyAndPublish } from "@/lib/notification-service";

// Talep atama API endpoint'i
// POST: Talebi bir satınalma personeline ata
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireAuthApi(req);

        if (!auth) {
            return NextResponse.json(
                { error: "Oturum açmanız gerekiyor" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await req.json();
        const { responsibleUserId, note } = body;

        if (!responsibleUserId) {
            return NextResponse.json(
                { error: "Sorumlu kişi seçilmedi" },
                { status: 400 }
            );
        }

        // Talebi kontrol et
        const request = await prisma.request.findUnique({
            where: { id },
            include: {
                status: true,
                unit: true
            }
        });

        if (!request) {
            return NextResponse.json(
                { error: "Talep bulunamadı" },
                { status: 404 }
            );
        }

        // Atanan kullanıcıyı kontrol et
        const assignedUser = await prisma.user.findUnique({
            where: { id: responsibleUserId },
            select: { id: true, username: true, email: true }
        });

        if (!assignedUser) {
            return NextResponse.json(
                { error: "Atanan kullanıcı bulunamadı" },
                { status: 404 }
            );
        }

        // Güncelle
        const updatedRequest = await prisma.request.update({
            where: { id },
            data: {
                responsibleUserId,
                // İlk atamada owner'ı da ayarla (eğer boşsa)
                ownerUserId: request.ownerUserId || String(auth.userId)
            },
            include: {
                responsible: {
                    select: { id: true, username: true, email: true }
                },
                owner: {
                    select: { id: true, username: true, email: true }
                },
                status: true,
                unit: true
            }
        });

        // Bildirim gönder
        await notifyAndPublish({
            userId: responsibleUserId,
            title: "Yeni Talep Atandı",
            body: `${request.barcode} - ${request.subject} talebi size atandı.`,
            type: "info",
            link: `/talep/detay/${id}`
        });

        // Yorum olarak atama notunu ekle (eğer varsa)
        if (note) {
            await prisma.comment.create({
                data: {
                    requestId: id,
                    authorId: String(auth.userId),
                    text: `[ATAMA] ${assignedUser.username} kullanıcısına atandı. Not: ${note}`
                }
            });
        }

        return NextResponse.json({
            message: "Talep başarıyla atandı",
            request: updatedRequest
        });

    } catch (error) {
        console.error("[Request Assign] Error:", error);
        return NextResponse.json(
            { error: "Talep atanamadı" },
            { status: 500 }
        );
    }
}

// GET: Atama bilgisini getir
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireAuthApi(req);

        if (!auth) {
            return NextResponse.json(
                { error: "Oturum açmanız gerekiyor" },
                { status: 401 }
            );
        }

        const { id } = await params;

        const request = await prisma.request.findUnique({
            where: { id },
            select: {
                id: true,
                responsibleUserId: true,
                ownerUserId: true,
                responsible: {
                    select: { id: true, username: true, email: true }
                },
                owner: {
                    select: { id: true, username: true, email: true }
                }
            }
        });

        if (!request) {
            return NextResponse.json(
                { error: "Talep bulunamadı" },
                { status: 404 }
            );
        }

        return NextResponse.json(request);

    } catch (error) {
        console.error("[Request Assign GET] Error:", error);
        return NextResponse.json(
            { error: "Atama bilgisi alınamadı" },
            { status: 500 }
        );
    }
}
