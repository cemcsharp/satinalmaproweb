import { NextRequest, NextResponse } from "next/server";
import { signResetToken } from "@/lib/auth";
import { jsonError } from "@/lib/apiError";
import { prisma } from "@/lib/db";
import { dispatchEmail, renderEmailTemplate } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = String(body?.userId || body?.userIdOrEmail || "").trim();
    if (!identifier) return jsonError(400, "invalid_payload");

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    });

    if (!user || !user.email) {
      // Security: Don't reveal if user exists, just return ok:true
      return NextResponse.json({ ok: true });
    }

    const token = signResetToken({ userId: user.id });
    const origin = req.nextUrl.origin;
    const resetUrl = `${origin}/login/reset/${token}`;

    // Send the email
    const subject = "Şifre Sıfırlama Talebi";
    const html = renderEmailTemplate("generic", {
      title: "Şifre Sıfırlama",
      body: `<p>Merhaba ${user.username || "Kullanıcı"},</p>
             <p>Hesabınız için şifre sıfırlama talebinde bulunuldu. Şifrenizi sıfırlamak için aşağıdaki butona tıklayabilirsiniz.</p>
             <p>Eğer bu talebi siz yapmadıysanız, bu e-postayı dikkate almayınız.</p>`,
      actionUrl: resetUrl,
      actionText: "Şifremi Sıfırla"
    });

    await dispatchEmail({
      to: user.email,
      subject,
      html,
      category: "password_reset"
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonError(500, "server_error", { message });
  }
}