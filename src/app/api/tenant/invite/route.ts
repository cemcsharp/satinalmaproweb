import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/apiAuth";
import crypto from "crypto";
import { dispatchEmail, renderEmailTemplate } from "@/lib/mailer";

/**
 * Yeni kullanıcı davetiyesi oluşturur ve e-posta gönderir.
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getSessionUser();
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
        }

        const body = await req.json();
        const { email, roleId } = body;

        if (!email || !roleId) {
            return NextResponse.json({ error: "E-posta ve rol zorunludur" }, { status: 400 });
        }

        // Kullanıcının sistemde zaten var olup olmadığını kontrol et
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (existingUser) {
            return NextResponse.json({ error: "Bu kullanıcı zaten kayıtlı" }, { status: 400 });
        }

        // Aktif/Bekleyen davetiyeyi kontrol et
        const existingInvite = await prisma.invitation.findFirst({
            where: {
                email: email.toLowerCase(),
                tenantId: user.tenantId,
                status: "pending"
            }
        });

        if (existingInvite) {
            // Davetiyeyi güncelleyebilir veya hata verebiliriz
            // Şimdilik hata verelim
            return NextResponse.json({ error: "Bu kullanıcıya zaten gönderilmiş bir davetiye var" }, { status: 400 });
        }

        // Token üret
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 gün geçerli

        // Davetiyeyi kaydet
        const invitation = await prisma.invitation.create({
            data: {
                email: email.toLowerCase().trim(),
                roleId,
                tenantId: user.tenantId,
                invitedById: user.id,
                token,
                expiresAt,
                status: "pending"
            },
            include: {
                tenant: true,
                role: true
            }
        });

        // E-posta gönder
        try {
            const origin = req.nextUrl.origin;
            const inviteUrl = `${origin}/invite/${token}`;

            const html = renderEmailTemplate("generic", {
                title: "Platforma Davet Edildiniz!",
                body: `
                    <p>Merhaba,</p>
                    <p><strong>${invitation.tenant.name}</strong> firması sizi platformumuza <strong>${invitation.role.name}</strong> olarak davet etti.</p>
                    <p>Hesabınızı oluşturmak ve aralarına katılmak için aşağıdaki butona tıklayın.</p>
                    <p>Bu davetiye 7 gün boyunca geçerlidir.</p>
                `,
                actionUrl: inviteUrl,
                actionText: "Daveti Kabul Et"
            });

            await dispatchEmail({
                to: email,
                subject: `${invitation.tenant.name} firmasından davet aldınız`,
                html,
                category: "invitation"
            });
        } catch (emailError) {
            console.error("Davet e-postası gönderilemedi:", emailError);
            // E-posta gitmese de davetiye veritabanında oluştu, kullanıcı arayüzden tekrar deneyebilir
        }

        return NextResponse.json({
            ok: true,
            message: "Davetiye başarıyla gönderildi",
            invitation
        });

    } catch (error: any) {
        console.error("Davet oluşturulurken KRİTİK HATA:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
        return NextResponse.json({
            error: "Sunucu hatası: " + (error.message || "Bilinmeyen hata"),
            details: error.toString()
        }, { status: 500 });
    }
}

/**
 * Bekleyen davetiyeyi iptal eder (siler).
 */
export async function DELETE(req: NextRequest) {
    try {
        const user = await getSessionUser();
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Davetiye ID gereklidir" }, { status: 400 });
        }

        // Davetiyeyi bul ve kontrol et
        const invite = await prisma.invitation.findUnique({
            where: { id }
        });

        if (!invite) {
            return NextResponse.json({ error: "Davetiye bulunamadı" }, { status: 404 });
        }

        if (invite.tenantId !== user.tenantId) {
            return NextResponse.json({ error: "Bu davetiyeyi silme yetkiniz yok" }, { status: 403 });
        }

        if (invite.status !== "pending") {
            return NextResponse.json({ error: "Sadece bekleyen davetiyeler iptal edilebilir" }, { status: 400 });
        }

        // Silme işlemi
        await prisma.invitation.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: "Davetiye iptal edildi" });

    } catch (error: any) {
        console.error("Davetiye silme hatası:", error);
        return NextResponse.json({ error: "Sunucu hatası: " + error.message }, { status: 500 });
    }
}
