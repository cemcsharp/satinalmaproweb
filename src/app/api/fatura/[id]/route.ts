import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const body = await req.json();
    const { status } = body as { status: string };
    const updated = await prisma.invoice.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const inv = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        order: {
          select: {
            supplier: { select: { name: true, taxId: true } },
            company: { select: { name: true, taxId: true, address: true } },
          },
        },
      },
    });
    return NextResponse.json(inv);
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}

// Full update for selected fields
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const body = await req.json().catch(() => ({}));
    const status = typeof body.status === "string" ? String(body.status) : undefined;
    const dueDateRaw = body?.dueDate;
    const bank = typeof body.bank === "string" ? String(body.bank) : undefined;
    const responsibleUserId = typeof body.responsibleUserId === "string" ? String(body.responsibleUserId).trim() || null : undefined;

    const data: any = {};
    if (typeof status !== "undefined") data.status = status;
    if (typeof bank !== "undefined") data.bank = bank || null;
    if (typeof dueDateRaw !== "undefined") {
      const d = dueDateRaw ? new Date(dueDateRaw) : null;
      if (d && isNaN(d.getTime())) return jsonError(400, "invalid_dueDate");
      data.dueDate = d;
    }
    if (typeof responsibleUserId !== "undefined") {
      if (responsibleUserId) data.responsible = { connect: { id: responsibleUserId } };
      else data.responsibleUserId = null;
    }

    if (Object.keys(data).length === 0) return jsonError(400, "no_fields_to_update");

    const updated = await prisma.invoice.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    await prisma.invoice.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const code = e?.code;
    if (code === "P2025") { // Record not found
      return jsonError(404, "not_found");
    }
    return jsonError(500, "server_error", { message: e?.message });
  }
}
