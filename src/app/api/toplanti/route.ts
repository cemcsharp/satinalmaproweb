import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { requireAuthApi } from "@/lib/apiAuth";
import { jsonError } from "@/lib/apiError";
import { dispatchEmail, renderEmailTemplate } from "@/lib/mailer";
import { publish } from "@/app/api/toplanti/sse/[id]/route";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status") || "";
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const sortBy = (searchParams.get("sortBy") || "date") as "date" | "title";
  const sortDir = (searchParams.get("sortDir") || "desc") as "asc" | "desc";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));

  try {
    const where: any = {
      AND: [
        q ? { title: { contains: q, mode: "insensitive" } } : {},
        status ? { status } : {},
        dateFrom || dateTo
          ? {
              startAt: {
                gte: dateFrom ? new Date(dateFrom) : undefined,
                lte: dateTo ? new Date(dateTo) : undefined,
              },
            }
          : {},
      ],
    };

    const orderBy = sortBy === "title" ? { title: sortDir } : { startAt: sortDir };

    const [total, rows] = await Promise.all([
      prisma.meeting.count({ where }),
      prisma.meeting.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize, include: { organizer: true } }),
    ]);

    const items = rows.map((m) => ({
      id: m.id,
      title: m.title,
      startAt: m.startAt.toISOString(),
      endAt: m.endAt ? m.endAt.toISOString() : null,
      status: m.status,
      organizer: m.organizer?.username || null,
      location: m.location || null,
    }));

    return NextResponse.json({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuthApi(req);
    const userId = auth?.userId || (await getServerSession(authOptions) as any)?.user?.id || null;
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const title = String(body?.title || "").trim();
    const startAtRaw = body?.startAt;
    const endAtRaw = body?.endAt;
    const durationMinutes = body?.durationMinutes == null ? undefined : Number(body.durationMinutes);
    const location = typeof body?.location === "string" ? String(body.location) : undefined;
    const attendeesEmails: string[] = Array.isArray(body?.attendeesEmails) ? body.attendeesEmails.map((x: any) => String(x)).filter(Boolean) : [];
    const attendeesUserIds: string[] = Array.isArray(body?.attendeesUserIds) ? body.attendeesUserIds.map((x: any) => String(x)).filter(Boolean) : [];
    if (!title) return jsonError(400, "title_required");
    const startAt = startAtRaw ? new Date(startAtRaw) : null;
    if (!startAt || isNaN(startAt.getTime())) return jsonError(400, "invalid_startAt");
    const endAt = endAtRaw ? new Date(endAtRaw) : null;
    if (endAt && isNaN(endAt.getTime())) return jsonError(400, "invalid_endAt");

    const created = await prisma.meeting.create({
      data: {
        title,
        startAt,
        endAt: endAt || null,
        durationMinutes: Number.isFinite(Number(durationMinutes)) ? Number(durationMinutes) : null,
        status: "planned",
        organizer: { connect: { id: String(userId) } },
        location: location || null,
        attendees: {
          create: [
            ...attendeesUserIds.map((uid) => ({ user: { connect: { id: uid } } })),
            ...attendeesEmails.map((em) => ({ email: em })),
          ],
        },
      },
      include: { organizer: true },
    });
    try {
      const link = `${new URL(req.url).origin}/toplanti/liste`;
      const subject = `Toplantı Planlandı – ${created.title}`;
      const fields = [
        { label: "Başlık", value: created.title },
        { label: "Başlangıç", value: created.startAt.toLocaleString("tr-TR") },
        ...(created.location ? [{ label: "Konum", value: created.location }] : []),
        { label: "Organizatör", value: created.organizer?.username || "" },
      ];
      const html = renderEmailTemplate("detail", { title: subject, intro: "Toplantı planlandı.", fields, items: [], actionUrl: link, actionText: "Toplantıları Aç" });
      const emails = attendeesEmails;
      for (const to of Array.from(new Set(emails)).filter(Boolean)) {
        await dispatchEmail({ to, subject, html, category: "meeting_create" });
      }
    } catch {}
    try { publish(created.id, "meeting_created", { id: created.id }); } catch {}
    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch (e: any) {
    const msg = e?.message || "unknown";
    const code = (e as any)?.code;
    if (code === "P2003") return jsonError(400, "invalid_relation", { message: msg });
    if (code === "P2002") return jsonError(409, "duplicate", { message: msg });
    return jsonError(500, "server_error", { message: msg });
  }
}
