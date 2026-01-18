import { NextRequest, NextResponse } from "next/server";
import { getSystemSettings } from "@/lib/settings";
import { dispatchEmail } from "@/lib/mailer";
import { renderEmailTemplate } from "@/lib/mailer";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, company, phone, notes } = body;

        if (!name || !email) {
            return NextResponse.json({ error: "missing_fields" }, { status: 400 });
        }

        const settings = await getSystemSettings();
        const supportEmail = settings.supportEmail || "destek@satinalma.app";

        // Build internal notification email
        const internalHtml = renderEmailTemplate("generic", {
            title: "Yeni Demo Talebi",
            body: `
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <p><strong>Ad Soyad:</strong> ${name}</p>
          <p><strong>E-posta:</strong> ${email}</p>
          <p><strong>Firma:</strong> ${company || 'Belirtilmedi'}</p>
          <p><strong>Telefon:</strong> ${phone || 'Belirtilmedi'}</p>
          <p><strong>Notlar:</strong> ${notes || 'Yok'}</p>
        </div>
        <p style="margin-top: 20px; color: #64748b; font-size: 14px;">Bu talep satinalma.app ana sayfası üzerinden gönderilmiştir.</p>
      `,
        });

        // Dispatch email to support
        await dispatchEmail({
            to: supportEmail,
            subject: `Yeni Demo Talebi: ${company || name}`,
            html: internalHtml,
            category: "demo_request"
        });

        // (Optional) Send confirmation to the user
        try {
            const userHtml = renderEmailTemplate("generic", {
                title: "Demo Talebiniz Alındı",
                body: `
          <p>Merhaba ${name},</p>
          <p>satinalma.app platformu için yaptığınız demo talebi başarıyla tarafımıza ulaşmıştır.</p>
          <p>Ekibimiz en kısa sürede sizinle iletişime geçerek bir tanışma toplantısı planlayacaktır.</p>
          <p>Bize gösterdiğiniz ilgi için teşekkür ederiz.</p>
        `,
            });

            await dispatchEmail({
                to: email,
                subject: "Demo Talebiniz Hakkında - satinalma.app",
                html: userHtml,
                category: "demo_confirmation"
            });
        } catch (emailErr) {
            console.error("Failed to send confirmation email to user:", emailErr);
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Demo request error:", error);
        return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
}
