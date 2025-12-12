import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRoleApi } from "@/lib/apiAuth";
import { notify } from "@/lib/notification-service";
import { dispatchEmail, renderEmailTemplate } from "@/lib/mailer";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const admin = await ensureRoleApi(req, "admin");
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const now = new Date();
  const daysList = [30, 15, 7, 1];
  let created = 0;
  for (const d of daysList) {
    const until = new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
    const items = await prisma.contract.findMany({
      where: { endDate: { gte: now, lte: until }, status: { notIn: ["Sonlanmış", "Bitmiş"] } },
      include: { responsible: true, order: { include: { request: { include: { responsible: true, owner: true } } } } },
    });
    for (const c of items) {
      const title = `Sözleşme Sonu Yaklaşıyor: ${c.title}`;
      const body = `Sözleşme No: ${c.number}<br/>Bitiş: ${c.endDate?.toISOString?.().slice(0, 10) || ""}<br/>Kalan gün: ${d}`;
      const req = (c as any)?.order?.request || null;
      const targets = [(c as any)?.responsible?.id, req?.responsible?.id, req?.owner?.id].filter(Boolean) as string[];
      for (const uid of targets) {
        await notify({ userId: uid, title, body: `Bitiyor: ${c.endDate?.toISOString?.() || ""}`, type: "warning" });
      }
      const emails: string[] = [];
      if ((c as any)?.responsible?.email) emails.push(String((c as any).responsible.email));
      if (req?.responsible?.email) emails.push(String(req.responsible.email));
      if (req?.owner?.email) emails.push(String(req.owner.email));
      if (req?.unitEmail) emails.push(String(req.unitEmail));
      const origin = req.nextUrl.origin;
      const link = `${origin}/sozlesme/detay/${encodeURIComponent(c.id)}`;
      const html = renderEmailTemplate("generic", { title, body, actionUrl: link, actionText: "Sözleşmeyi Aç" });
      for (const to of Array.from(new Set(emails)).filter(Boolean)) {
        await dispatchEmail({ to, subject: title, html, category: "contract_expiry" });
      }
      created += emails.length;
    }
  }
  return NextResponse.json({ ok: true, count: created });
}
