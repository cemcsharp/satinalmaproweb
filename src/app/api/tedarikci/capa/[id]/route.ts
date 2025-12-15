import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const item = await prisma.cAPA.findUnique({
      where: { id },
      include: {
        supplier: true,
        order: true,
        evaluation: true,
        actions: { orderBy: { createdAt: "asc" } },
        whys: { orderBy: { idx: "asc" } },
        histories: { orderBy: { date: "asc" } },
      },
    });
    if (!item) return jsonError(404, "not_found");
    return NextResponse.json(item);
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const existing = await prisma.cAPA.findUnique({ where: { id } });
    if (!existing) return jsonError(404, "not_found");
    const body = await req.json();
    const data: any = {};
    if (typeof body.title === "string") data.title = body.title;
    if (typeof body.description === "string") data.description = body.description;
    if (typeof body.corrective !== "undefined") data.corrective = body.corrective ?? null;
    if (typeof body.preventive !== "undefined") data.preventive = body.preventive ?? null;
    if (typeof body.status === "string") data.status = body.status;
    if (typeof body.orderId !== "undefined") data.orderId = body.orderId ?? null;
    if (typeof body.evaluationId !== "undefined") data.evaluationId = body.evaluationId ?? null;
    // Extended fields
    if (typeof body.problemWho !== "undefined") data.problemWho = body.problemWho ?? null;
    if (typeof body.problemWhen !== "undefined") data.problemWhen = body.problemWhen ?? null;
    if (typeof body.problemWhere !== "undefined") data.problemWhere = body.problemWhere ?? null;
    if (typeof body.problemHow !== "undefined") data.problemHow = body.problemHow ?? null;
    if (typeof body.effectivenessMethod !== "undefined") data.effectivenessMethod = body.effectivenessMethod ?? null;
    if (typeof body.verificationResult !== "undefined") data.verificationResult = body.verificationResult ?? null;
    if (typeof body.sustainabilityNotes !== "undefined") data.sustainabilityNotes = body.sustainabilityNotes ?? null;
    if (typeof body.approvalStatus !== "undefined") data.approvalStatus = body.approvalStatus ?? null;
    if (typeof body.approvedAt !== "undefined") data.approvedAt = body.approvedAt ?? null;
    if (typeof body.approverId !== "undefined") data.approverId = body.approverId ?? null;

    const updated = await prisma.cAPA.update({ where: { id }, data });
    // Log status changes
    if (typeof body.status === "string" && body.status !== existing.status) {
      await prisma.cAPAHistory.create({ data: { capaId: id, event: "status_change", details: `${existing.status} -> ${body.status}` } });
    }
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === "P2025") {
      return jsonError(404, "not_found");
    }
    return jsonError(500, "capa_update_failed", { message: e?.message });
  }
}