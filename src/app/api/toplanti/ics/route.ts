import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function toIcsDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });
  const m = await prisma.meeting.findUnique({ where: { id }, include: { organizer: true } });
  if (!m) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const start = m.startAt;
  const end = m.endAt || new Date(m.startAt.getTime() + (Number(m.durationMinutes || 60) * 60_000));
  const uid = `meeting-${m.id}@satinalmapro.local`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SatinalmaPro//Meeting//TR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${m.title}`,
    `DESCRIPTION:${(m.description || "").replace(/\n/g, "\\n")}`,
    m.location ? `LOCATION:${m.location}` : undefined,
    `ORGANIZER;CN=${m.organizer?.username || "Organizatör"}:mailto:noreply@satinalmapro.local`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean) as string[];
  const body = lines.join("\r\n");
  return new NextResponse(body, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename=meeting-${m.id}.ics` } });
}

