import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const format = (url.searchParams.get("format") || "csv").toLowerCase();
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });
  const m = await prisma.meeting.findUnique({
    where: { id },
    include: {
      organizer: true,
      attendees: { include: { user: true } },
      notes: { orderBy: { createdAt: "asc" } },
      actionItems: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!m) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (format === "csv") {
    const csv = [
      ["Başlık", m.title],
      ["Başlangıç", m.startAt.toISOString()],
      ["Durum", m.status],
      ["Konum", m.location || ""],
      ["Organizatör", m.organizer?.username || ""],
    ].map((r) => r.map((x) => String(x ?? "")).join(",")).join("\n");
    const notes = (m.notes || []).map((n) => ["NOT", (n.createdAt as any)?.toISOString?.() || "", String(n.content || "").replace(/\n/g, " ")].join(",")).join("\n");
    const actions = (m.actionItems || []).map((a) => ["AKSIYON", a.title, a.status, a.dueDate ? new Date(a.dueDate).toISOString() : ""].join(",")).join("\n");
    const body = [csv, notes, actions].filter(Boolean).join("\n");
    try {
      await prisma.meetingReport.create({
        data: {
          meetingId: m.id,
          format: "csv",
          url: null,
          payload: {
            title: m.title,
            noteCount: (m.notes || []).length,
            actionCount: (m.actionItems || []).length,
            generatedAt: new Date().toISOString(),
          } as any,
        },
      });
    } catch {}
    return new NextResponse(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename=meeting-${m.id}.csv` } });
  }
  if (format === "pdf") {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const { width } = page.getSize();
    const margin = 40;
    let y = 800;
    const sizeTitle = 16;
    const sizeText = 11;
    const color = rgb(0, 0, 0);
    const w = (t: string, s: number) => font.widthOfTextAtSize(t, s);
    const drawLine = (t: string, s: number) => { page.drawText(t, { x: margin, y, size: s, font, color }); y -= s + 8; };
    const wrap = (t: string, s: number) => {
      const max = width - margin * 2;
      const words = String(t || "").split(/\s+/);
      let line = "";
      const out: string[] = [];
      for (const word of words) {
        const test = line ? line + " " + word : word;
        if (w(test, s) <= max) {
          line = test;
        } else {
          if (line) out.push(line);
          line = word;
        }
      }
      if (line) out.push(line);
      return out;
    };
    drawLine("Toplantı Raporu", sizeTitle);
    drawLine(String(m.title || ""), sizeText);
    drawLine(`Başlangıç: ${m.startAt.toLocaleString("tr-TR")}`, sizeText);
    if (m.endAt) drawLine(`Bitiş: ${m.endAt.toLocaleString("tr-TR")}`, sizeText);
    drawLine(`Durum: ${String(m.status || "")}`, sizeText);
    if (m.location) drawLine(`Konum: ${String(m.location)}`, sizeText);
    const org = m.organizer?.username || m.organizer?.email || "";
    if (org) drawLine(`Organizatör: ${org}`, sizeText);
    const att = (m.attendees || []).map((a) => a.user?.username || a.user?.email || a.email || "").filter(Boolean).join(", ");
    if (att) {
      const lines = wrap(`Katılımcılar: ${att}`, sizeText);
      for (const ln of lines) drawLine(ln, sizeText);
    }
    y -= 8;
    drawLine("Notlar", sizeTitle);
    for (const n of m.notes || []) {
      const dt = (n as any).createdAt ? new Date((n as any).createdAt).toLocaleString("tr-TR") : "";
      const text = `${dt} · ${String((n as any).content || "")}`;
      const lines = wrap(text, sizeText);
      for (const ln of lines) drawLine(ln, sizeText);
    }
    y -= 8;
    drawLine("Aksiyonlar", sizeTitle);
    for (const a of m.actionItems || []) {
      const dt = a.dueDate ? new Date(a.dueDate as any).toLocaleDateString("tr-TR") : "";
      const text = `${String(a.title || "")} · ${String(a.status || "")} ${dt ? "·" : ""} ${dt}`;
      const lines = wrap(text, sizeText);
      for (const ln of lines) drawLine(ln, sizeText);
    }
    const bytes = await doc.save();
    try {
      await prisma.meetingReport.create({
        data: {
          meetingId: m.id,
          format: "pdf",
          url: null,
          payload: {
            title: m.title,
            noteCount: (m.notes || []).length,
            actionCount: (m.actionItems || []).length,
            generatedAt: new Date().toISOString(),
          } as any,
        },
      });
    } catch {}
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
    return new Response(blob, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename=meeting-${m.id}.pdf` } });
  }
  return NextResponse.json({ error: "unsupported_format" }, { status: 400 });
}
