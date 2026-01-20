import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

/**
 * Davetiyeyi doğrular (GET) veya kabul eder (POST).
 */
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await context.params;

        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: {
                tenant: {
                    select: { name: true }
                },
                role: {
                    select: { name: true }
                }
            }
        });

        if (!invitation) {
            return NextResponse.json({ error: "Geçersiz davetiye" }, { status: 404 });
        }

        if (invitation.status !== "pending") {
            return NextResponse.json({ error: "Bu davetiye zaten kullanılmış" }, { status: 400 });
        }

        if (invitation.expiresAt < new Date()) {
            return NextResponse.json({ error: "Bu davetiyenin süresi dolmuş" }, { status: 400 });
        }

        return NextResponse.json(invitation);
    } catch (error) {
        console.error("Davetiye doğrulanırken hata:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await context.params;
        const body = await req.json();
        const { fullName, password } = body;

        console.log("[Invite Accept Debug] Body received:", { fullName, password: "***" });

        if (!fullName || !password) {
            console.log("[Invite Accept Debug] Missing fullName or password");
            return NextResponse.json({ error: "Ad soyad ve şifre zorunludur" }, { status: 400 });
        }

        // Davetiyeyi bul
        const invitation = await prisma.invitation.findUnique({
            where: { token }
        });

        if (!invitation || invitation.status !== "pending" || invitation.expiresAt < new Date()) {
            console.log("[Invite Accept Debug] Invalid invitation state:", {
                found: !!invitation,
                status: invitation?.status,
                expiresAt: invitation?.expiresAt,
                now: new Date()
            });
            return NextResponse.json({ error: "Geçersiz veya süresi dolmuş davetiye" }, { status: 400 });
        }

        // Şifreyi hash'le
        const passwordHash = await bcrypt.hash(password, 12);

        // Kullanıcıyı oluştur (Transaction ile)
        const result = await prisma.$transaction(async (tx) => {
            // 1. Kullanıcıyı oluştur
            const user = await tx.user.create({
                data: {
                    username: fullName.trim(),
                    email: invitation.email,
                    passwordHash,
                    roleId: invitation.roleId,
                    tenantId: invitation.tenantId,
                    isActive: true, // Davetle gelenler direkt aktif
                }
            });

            // 2. Davetiyeyi 'accepted' yap
            await tx.invitation.update({
                where: { id: invitation.id },
                data: { status: "accepted" }
            });

            return user;
        });

        return NextResponse.json({
            ok: true,
            message: "Hesabınız başarıyla oluşturuldu. Giriş yapabilirsiniz.",
            user: {
                id: result.id,
                email: result.email
            }
        });

    } catch (error) {
        console.error("Davet kabul edilirken hata:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
