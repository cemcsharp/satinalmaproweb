import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const supplierId = searchParams.get("supplierId") || "";
  try {
    const items = await prisma.cAPA.findMany({
      where: {
        AND: [
          status ? { status } : {},
          supplierId ? { supplierId } : {},
        ],
      },
      orderBy: { openedAt: "desc" },
      include: { supplier: true, order: true, evaluation: true },
    });
    return NextResponse.json({ items, total: items.length });
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = String(body?.title || "").trim();
    const description = String(body?.description || "").trim();
    const supplierId = String(body?.supplierId || "").trim();
    const status = String(body?.status || "open").trim();
    const details: string[] = [];
    if (!title) details.push("title_required");
    if (!description) details.push("description_required");
    if (!supplierId) details.push("supplier_required");
    if (title && title.length < 5) details.push("title_too_short");
    if (description && description.length < 20) details.push("description_too_short");
    const allowedStatus = new Set(["open", "in_progress", "closed"]);
    if (!allowedStatus.has(status)) details.push("invalid_status");
    if (details.length) return jsonError(400, "invalid_payload", { details });
    const supplierExists = await prisma.supplier.findUnique({ where: { id: supplierId } }).catch(() => null);
    if (!supplierExists) return jsonError(400, "supplier_not_found");
    const problemWhenRaw = body?.problemWhen;
    const approvedAtRaw = body?.approvedAt;
    const problemWhen = problemWhenRaw ? new Date(problemWhenRaw) : null;
    const approvedAt = approvedAtRaw ? new Date(approvedAtRaw) : null;
    if (problemWhenRaw && (!problemWhen || isNaN(problemWhen.getTime()))) return jsonError(400, "invalid_payload", { details: ["invalid_problemWhen"] });
    if (approvedAtRaw && (!approvedAt || isNaN(approvedAt.getTime()))) return jsonError(400, "invalid_payload", { details: ["invalid_approvedAt"] });
    const created = await prisma.cAPA.create({
      data: {
        title,
        description,
        corrective: body?.corrective || null,
        preventive: body?.preventive || null,
        status,
        supplierId,
        orderId: body?.orderId || null,
        evaluationId: body?.evaluationId || null,
        // Extended problem definition
        problemWho: body?.problemWho || null,
        problemWhen,
        problemWhere: body?.problemWhere || null,
        problemHow: body?.problemHow || null,
        // Effectiveness and verification
        effectivenessMethod: body?.effectivenessMethod || null,
        verificationResult: body?.verificationResult || null,
        sustainabilityNotes: body?.sustainabilityNotes || null,
        // Approval placeholders
        approvalStatus: body?.approvalStatus || null,
        approvedAt,
        approverId: body?.approverId || null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}