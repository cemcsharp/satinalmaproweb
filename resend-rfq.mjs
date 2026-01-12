import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

async function main() {
  const rfqCode = "RFQ-112233";
  console.log(`Searching for RFQ: ${rfqCode}`);

  const rfq = await prisma.rfq.findFirst({
    where: { rfxCode: rfqCode },
    include: { suppliers: true }
  });

  if (!rfq) {
    console.error("RFQ not found");
    return;
  }

  const smtp = await prisma.smtpSetting.findFirst({ where: { isDefault: true, active: true } });
  if (!smtp) {
    console.error("Default SMTP not found");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass }
  });

  console.log(`Sending emails for ${rfq.suppliers.length} suppliers...`);

  for (const invite of rfq.suppliers) {
    const link = `http://localhost:3000/portal/rfq/${invite.token}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; line-height: 1.6; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; padding: 12px; background-color: #1e293b; border-radius: 12px;">
            <span style="color: #fbbf24; font-size: 24px; font-weight: bold;">SatınalmaPRO</span>
          </div>
        </div>
        
        <h2 style="color: #0f172a; margin-bottom: 16px; text-align: center; font-weight: 800;">Kurumsal Teklif İstek Formu</h2>
        
        <p style="color: #334155;">Sayın <strong>${invite.contactName}</strong>,</p>
        <p style="color: #334155;">Kurumumuzun <strong>"${rfq.title}"</strong> konulu satın alma süreci için sizi kurumsal tedarikçi portalımıza davet ediyoruz.</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e293b; font-size: 16px;">🚀 Kurumsal Hesap Aktivasyonu</h3>
          <p style="margin-bottom: 0; font-size: 14px; color: #475569;">
            Bu davetle birlikte sistemimizde size özel bir alan ayrılmıştır. İlk girişinizde firma bilgilerinizi onaylayıp <strong>kendi şifrenizi</strong> belirleyerek kurumsal hesabınızı aktifleştirebilirsiniz.
          </p>
        </div>

        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 16px; border-radius: 12px; margin: 20px 0;">
          <strong style="color: #b45309;">⚠️ KRİTİK NOT:</strong> 
          <span style="color: #92400e; font-size: 14px;">Tüm birim fiyatlar <strong>KDV HARİÇ</strong> olarak girilmelidir.</span>
        </div>

        <p style="color: #334155; font-size: 14px;">Aşağıdaki güvenli bağlantıyı kullanarak portalınıza giriş yapabilir ve teklifinizi hızla iletebilirsiniz:</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${link}" style="display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">Hemen Kaydol ve Teklif Ver</a>
        </div>

        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; color: #64748b; font-size: 13px;">
          <table style="width: 100%;">
            <tr>
              <td><strong>RFX Kodu:</strong> ${rfq.rfxCode}</td>
              <td style="text-align: right;"><strong>Son Tarih:</strong> ${rfq.deadline ? rfq.deadline.toLocaleDateString("tr-TR") : "Belirtilmedi"}</td>
            </tr>
          </table>
        </div>

        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;">
        <p style="font-size: 11px; color: #94a3b8; text-align: center; font-style: italic;">
          Bu e-posta otomatik olarak gönderilmiştir. Portala erişim linkiniz size özeldir, lütfen üçüncü şahıslarla paylaşmayınız.
        </p>
        <p style="font-size: 11px; color: #cbd5e1; text-align: center; margin-top: 8px;">
          © ${new Date().getFullYear()} SatınalmaPRO Link • Kurumsal Tedarik Zinciri Yönetimi
        </p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: smtp.from,
        to: invite.email,
        subject: `Teklif İsteği: ${rfq.rfxCode} - ${rfq.title}`,
        html
      });
      console.log(`Email sent to ${invite.email}`);
    } catch (err) {
      console.error(`Failed to send email to ${invite.email}:`, err);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
