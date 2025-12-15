import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dispatchEmail, renderEmailTemplate } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  // Trigger: find meetings with reminderMinutesBefore set and not sent yet, and within window
  const now = new Date();
  const windowMinutes = 5; // run reminders if startAt within [0, reminderMinutesBefore] minutes from now
  const meetings = await prisma.meeting.findMany({
    where: {
      reminderMinutesBefore: { not: null },
      lastReminderSentAt: null,
      startAt: { gte: new Date(now.getTime()), lte: new Date(now.getTime() + 60 * 60_000) },
    },
    include: { attendees: { include: { user: true } }, organizer: true },
    orderBy: { startAt: "asc" },
  });

  let sentCount = 0;
  for (const m of meetings) {
    const minsToStart = Math.round((m.startAt.getTime() - now.getTime()) / 60_000);
    const threshold = Number(m.reminderMinutesBefore || 0);
    if (threshold <= 0) continue;
    if (minsToStart < 0 || minsToStart > threshold + windowMinutes) continue;
    const subject = `Toplantı Hatırlatma – ${m.title}`;
    const fields = [
      { label: "Başlık", value: m.title },
      { label: "Başlangıç", value: m.startAt.toLocaleString("tr-TR") },
      { label: "Kalan Süre", value: `${Math.max(0, minsToStart)} dk` },
      ...(m.location ? [{ label: "Konum", value: m.location }] : []),
    ];
    const html = renderEmailTemplate("detail", { title: subject, intro: "Yaklaşan toplantı için hatırlatma.", fields, items: [], actionUrl: `${new URL(req.url).origin}/toplanti/liste`, actionText: "Toplantıları Aç" });
    const emails = [
      ...m.attendees.map((a) => a.email || a.user?.email).filter(Boolean) as string[],
    ];
    for (const to of Array.from(new Set(emails)).filter(Boolean)) {
      await dispatchEmail({ to, subject, html, category: "meeting_reminder" });
      sentCount++;
    }
    await prisma.meeting.update({ where: { id: m.id }, data: { lastReminderSentAt: new Date() } });
  }
  return NextResponse.json({ ok: true, sent: sentCount });
}

