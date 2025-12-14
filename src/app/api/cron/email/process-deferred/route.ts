import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRoleApi } from "@/lib/apiAuth";
import { dispatchEmail } from "@/lib/mailer";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const admin = await ensureRoleApi(req, "admin");
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Hours check removed

  const batch = await prisma.emailLog.findMany({ where: { status: "deferred" }, orderBy: { createdAt: "asc" }, take: 100 });
  let sent = 0, failed = 0;
  for (const row of batch) {
    if (!row.to || !row.subject || !row.payloadHtml) {
      await prisma.emailLog.update({ where: { id: row.id }, data: { status: "failed", lastError: "missing_payload" } });
      failed++;
      continue;
    }
    const res = await dispatchEmail({ to: row.to, subject: row.subject, html: row.payloadHtml, category: row.category || "general" });
    if (res.ok) {
      await prisma.emailLog.update({ where: { id: row.id }, data: { status: "sent", attempts: row.attempts + res.attempts, sentAt: new Date() } });
      sent++;
    } else {
      await prisma.emailLog.update({ where: { id: row.id }, data: { status: "failed", attempts: row.attempts + res.attempts, lastError: String(res.error || "unknown") } });
      failed++;
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  return NextResponse.json({ ok: true, processed: batch.length, sent, failed }, { status: 200 });
}
