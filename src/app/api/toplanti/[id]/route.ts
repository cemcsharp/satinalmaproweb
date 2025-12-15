import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const m = await prisma.meeting.findUnique({
      where: { id },
      include: {
        organizer: true,
        attendees: { include: { user: true } },
        notes: { include: { author: true }, orderBy: { createdAt: "desc" } },
        actionItems: { include: { owner: true }, orderBy: { createdAt: "desc" } },
        attachments: true,
        surveys: true,
      },
    });
    if (!m) return jsonError(404, "not_found");
    return NextResponse.json(m);
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}

