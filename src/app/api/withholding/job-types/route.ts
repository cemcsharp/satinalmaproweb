import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { jsonError } from "@/lib/apiError";
import { requireAuthApi, ensureRoleApi } from "@/lib/apiAuth";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuthApi(req);
    if (!auth) return jsonError(401, "unauthorized");
    const items = await prisma.withholdingJobType.findMany({
      where: { active: true },
      orderBy: [{ sort: "asc" }, { code: "asc" }],
      select: { code: true, label: true, ratio: true },
    });
    return NextResponse.json({ items, total: items.length });
  } catch (e) {
    return jsonError(500, "withholding_job_types_fetch_failed");
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await ensureRoleApi(req, "admin");
    if (!admin) return jsonError(403, "forbidden");
    const body = await req.json();
    const code = String(body?.code || "").trim();
    const label = String(body?.label || "").trim();
    const ratio = String(body?.ratio || "").trim();
    if (!code || !label || !ratio) return jsonError(400, "invalid_payload");
    const created = await prisma.withholdingJobType.create({ data: { code, label, ratio, active: true } });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return jsonError(500, "withholding_job_type_create_failed");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await ensureRoleApi(req, "admin");
    if (!admin) return jsonError(403, "forbidden");
    const body = await req.json();
    const code = String(body?.code || "").trim();
    if (!code) return jsonError(400, "invalid_payload");
    const data: Prisma.WithholdingJobTypeUpdateInput = {};
    if (typeof body.label === "string") data.label = String(body.label);
    if (typeof body.ratio === "string") data.ratio = String(body.ratio);
    if (typeof body.active === "boolean") data.active = Boolean(body.active);
    if (typeof body.sort === "number") data.sort = Number(body.sort);
    if (!Object.keys(data).length) return jsonError(400, "invalid_payload");
    await prisma.withholdingJobType.update({ where: { code }, data });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(500, "withholding_job_type_update_failed");
  }
}
