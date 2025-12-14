import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";

const transporterCache = new Map<string, Promise<nodemailer.Transporter>>();

async function getTransporter(key?: string): Promise<nodemailer.Transporter> {
  const cacheKey = String(key || "__default__");
  if (!transporterCache.has(cacheKey)) {
    transporterCache.set(cacheKey, (async () => {
      try {
        const cfg = key
          ? await prisma.smtpSetting.findUnique({ where: { key } })
          : await prisma.smtpSetting.findFirst({ where: { isDefault: true, active: true } })
          || await prisma.smtpSetting.findFirst({ where: { active: true } });
        if (cfg) {
          return nodemailer.createTransport({
            host: cfg.host,
            port: cfg.port,
            secure: cfg.secure,
            auth: { user: cfg.user, pass: cfg.pass },
          });
        }
      } catch { }
      const testAccount = await nodemailer.createTestAccount();
      return nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
    })());
  }
  return transporterCache.get(cacheKey)!;
}

export async function sendEmail(to: string, subject: string, html: string, smtpKey?: string) {
  const transporter = await getTransporter(smtpKey);
  let from = "bildirim@firma.com";
  try {
    const cfg = smtpKey
      ? await prisma.smtpSetting.findUnique({ where: { key: smtpKey } })
      : await prisma.smtpSetting.findFirst({ where: { isDefault: true, active: true } })
      || await prisma.smtpSetting.findFirst({ where: { active: true } });
    if (cfg?.from) from = cfg.from;
  } catch { }
  const info = await transporter.sendMail({ from, to, subject, html });
  const url = nodemailer.getTestMessageUrl(info) || null;
  return { messageId: (info as any).messageId, previewUrl: url };
}

export function renderEmailTemplate(name: string, vars: Record<string, unknown>) {
  const templates: Record<string, (v: Record<string, unknown>) => string> = {
    generic: (v) => {
      const title = String(v.title || "Bildirim");
      const body = String(v.body || "");
      const actionUrl = v.actionUrl ? String(v.actionUrl) : "";
      const actionText = v.actionText ? String(v.actionText) : "Görüntüle";
      const footerText = String(v.footerText || "Satınalma Pro");
      const brandColor = String(v.brandColor || "#0f172a"); // Corporate Slate 900
      const logoUrl = v.logoUrl ? String(v.logoUrl) : "";
      const btn = actionUrl
        ? `<tr><td align="center" style="padding-top:24px"><a href="${actionUrl}" style="display:inline-block;padding:12px 24px;background:${brandColor};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;box-shadow:0 4px 6px -1px rgba(15, 23, 42, 0.1)">${actionText}</a></td></tr>`
        : "";
      return `<!doctype html>
<html lang="tr">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Inter', sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 10px 15px -3px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="padding:32px;background:#ffffff;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:center;">
              <div style="text-align:center">
                ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="height:32px;width:auto;display:block;margin:0 auto 12px auto"/>` : ""}
                <span style="color:${brandColor};font-weight:800;font-size:20px;letter-spacing:-0.025em">SatınalmaPro</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 0 32px;text-align:center;">
              <h1 style="margin:0;color:#1e293b;font-size:24px;font-weight:700;letter-spacing:-0.025em">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 0 32px;color:#475569;font-size:15px;line-height:1.6;text-align:center;">${body}</td>
          </tr>
          ${btn}
          <tr>
            <td style="padding:40px 32px 32px 32px;text-align:center">
              <div style="height:1px;background:#e2e8f0;width:100%;margin-bottom:24px"></div>
              <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} ${footerText}. Tüm hakları saklıdır.</p>
              <p style="margin:8px 0 0 0;color:#cbd5e1;font-size:12px;">Bu e-posta otomatik olarak oluşturulmuştur.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    },
    detail: (v) => {
      const title = String(v.title || "Bildirim");
      const intro = String(v.intro || "");
      const actionUrl = v.actionUrl ? String(v.actionUrl) : "";
      const actionText = v.actionText ? String(v.actionText) : "Görüntüle";
      const footerText = String(v.footerText || "Satınalma Pro");
      const brandColor = String(v.brandColor || "#0f172a"); // Corporate Slate 900
      const logoUrl = v.logoUrl ? String(v.logoUrl) : "";
      const fields = Array.isArray((v as any).fields) ? ((v as any).fields as Array<{ label: string; value: string }>) : [];
      const items = Array.isArray((v as any).items) ? ((v as any).items as Array<{ name: string; quantity: number; unitPrice: number; total?: number }>) : [];
      const total = items.reduce((s, it) => s + Number(it.total ?? (Number(it.quantity) * Number(it.unitPrice))), 0);
      const fieldRows = fields.map((f) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;width:35%;font-weight:500">${f.label}</td><td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#334155;font-size:13px;font-weight:600">${f.value}</td></tr>`).join("");
      const itemRows = items.map((it) => `<tr>
  <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#334155;font-size:13px">${it.name}</td>
  <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;text-align:right">${Number(it.quantity)}</td>
  <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;text-align:right">${Number(it.unitPrice).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
  <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#334155;font-size:13px;text-align:right;font-weight:600">${Number(it.total ?? (Number(it.quantity) * Number(it.unitPrice))).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
</tr>`).join("");
      const btn = actionUrl
        ? `<tr><td align="center" style="padding-top:24px"><a href="${actionUrl}" style="display:inline-block;padding:12px 24px;background:${brandColor};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;box-shadow:0 4px 6px -1px rgba(15, 23, 42, 0.1)">${actionText}</a></td></tr>`
        : "";
      return `<!doctype html>
<html lang="tr">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Inter', sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 10px 15px -3px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="padding:32px;background:#ffffff;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:center;">
              <div style="text-align:center">
                ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="height:32px;width:auto;display:block;margin:0 auto 12px auto"/>` : ""}
                <span style="color:${brandColor};font-weight:800;font-size:20px;letter-spacing:-0.025em">SatınalmaPro</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 0 32px;text-align:center;">
              <h1 style="margin:0;color:#1e293b;font-size:24px;font-weight:700;letter-spacing:-0.025em">${title}</h1>
              ${intro ? `<p style="margin:12px 0 0 0;color:#64748b;font-size:15px;line-height:1.6;">${intro}</p>` : ""}
            </td>
          </tr>
          ${fieldRows ? `<tr><td style="padding:24px 32px 0 32px">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
              ${fieldRows}
            </table>
          </td></tr>` : ""}
          ${items.length ? `<tr><td style="padding:24px 32px 0 32px">
            <h3 style="margin:0 0 12px 0;color:#334155;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Kalemler</h3>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;border-collapse:separate;border-spacing:0;">
              <thead>
                <tr>
                  <th align="left" style="padding:10px 12px;background:#f1f5f9;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase">Ad</th>
                  <th align="right" style="padding:10px 12px;background:#f1f5f9;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase">Adet</th>
                  <th align="right" style="padding:10px 12px;background:#f1f5f9;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase">Birim</th>
                  <th align="right" style="padding:10px 12px;background:#f1f5f9;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase">Toplam</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
                <tr>
                  <td colspan="3" style="padding:12px;border-top:1px solid #e2e8f0;color:#334155;font-size:13px;background:#f8fafc;font-weight:700;text-align:right">Genel Toplam</td>
                  <td style="padding:12px;border-top:1px solid #e2e8f0;color:#0f172a;font-size:14px;text-align:right;background:#f8fafc;font-weight:700">${total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </td></tr>` : ""}
          ${btn}
          <tr>
            <td style="padding:40px 32px 32px 32px;text-align:center">
              <div style="height:1px;background:#e2e8f0;width:100%;margin-bottom:24px"></div>
              <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} ${footerText}. Tüm hakları saklıdır.</p>
              <p style="margin:8px 0 0 0;color:#cbd5e1;font-size:12px;">Bu e-posta otomatik olarak oluşturulmuştur.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    },
  };
  const fn = templates[name] || templates.generic;
  return fn(vars);
}

function withinBusinessHours(date = new Date(), startHour = 9, endHour = 18) {
  // Always allow emails immediately per user request
  return true;
}

export async function dispatchEmail(opts: { to: string; subject: string; html: string; category?: string; smtpKey?: string; maxAttempts?: number; startHour?: number; endHour?: number }) {
  const { to, subject, html, category = "general", smtpKey, maxAttempts = 3, startHour = 9, endHour = 18 } = opts;
  const now = new Date();
  const inHours = withinBusinessHours(now, startHour, endHour);
  let attempts = 0;
  let lastError: string | undefined;
  if (!inHours) {
    try {
      await prisma.emailLog.create({ data: { to, subject, category, status: "deferred", attempts, lastError: null, payloadHtml: html } as any });
    } catch { }
    return { ok: false, attempts, error: "deferred_outside_business_hours" };
  }
  while (attempts < maxAttempts) {
    attempts++;
    try {
      const info = await sendEmail(to, subject, html, smtpKey);
      try {
        await prisma.emailLog.create({ data: { to, subject, category, status: "sent", attempts, sentAt: new Date(), messageId: String(info?.messageId || ""), previewUrl: (info as any)?.previewUrl || null } as any });
      } catch { }
      return { ok: true, attempts };
    } catch (e: any) {
      lastError = e?.message || String(e);
      await new Promise((r) => setTimeout(r, 750 * attempts));
    }
  }
  try {
    await prisma.emailLog.create({ data: { to, subject, category, status: "failed", attempts, lastError, payloadHtml: html } as any });
  } catch { }
  return { ok: false, attempts, error: lastError };
}
