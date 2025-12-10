import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureAdminApi } from "@/lib/apiAuth";
import { jsonError } from "@/lib/apiError";

export async function GET(req: NextRequest) {
  try {
    // Public access allows for scoring types
    const items = await prisma.scoringType.findMany({
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ items });
  } catch (e) {
    console.error(e);
    return jsonError(500, "server_error");
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await ensureAdminApi(req);
    if (!admin) return jsonError(403, "forbidden");

    const body = await req.json();
    const name = String(body.name || "").trim();
    const code = String(body.code || "").trim();
    const kind = String(body.kind || "rating"); // rating, stars, percentage
    const scaleMin = Number(body.scaleMin || 1);
    const scaleMax = Number(body.scaleMax || 5);
    const step = Number(body.step || 1);
    const weightA = Number(body.weightA !== undefined ? body.weightA : 0.40);
    const weightB = Number(body.weightB !== undefined ? body.weightB : 0.30);
    const weightC = Number(body.weightC !== undefined ? body.weightC : 0.30);

    if (!name || !code) return jsonError(400, "missing_fields");

    // Check code uniqueness
    const existing = await prisma.scoringType.findUnique({ where: { code } });
    if (existing) return jsonError(409, "code_taken");

    const item = await prisma.scoringType.create({
      data: {
        name,
        code,
        kind,
        scaleMin,
        scaleMax,
        step,
        active: true,
        description: body.description || null,
        weightA,
        weightB,
        weightC
      }
    });

    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error(e);
    return jsonError(500, "server_error");
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await ensureAdminApi(req);
    if (!admin) return jsonError(403, "forbidden");

    const body = await req.json();
    const id = String(body.id || "");
    if (!id) return jsonError(400, "id_required");

    const data: any = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.kind !== undefined) data.kind = String(body.kind);
    if (body.scaleMin !== undefined) data.scaleMin = Number(body.scaleMin);
    if (body.scaleMax !== undefined) data.scaleMax = Number(body.scaleMax);
    if (body.step !== undefined) data.step = Number(body.step);
    if (body.active !== undefined) data.active = Boolean(body.active);
    if (body.description !== undefined) data.description = body.description || null;
    if (body.weightA !== undefined) data.weightA = Number(body.weightA);
    if (body.weightB !== undefined) data.weightB = Number(body.weightB);
    if (body.weightC !== undefined) data.weightC = Number(body.weightC);

    const item = await prisma.scoringType.update({
      where: { id },
      data
    });

    return NextResponse.json(item);
  } catch (e) {
    console.error(e);
    return jsonError(500, "server_error");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await ensureAdminApi(req);
    if (!admin) return jsonError(403, "forbidden");

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return jsonError(400, "id_required");

    // Check if used in questions
    const used = await prisma.evaluationQuestion.count({ where: { scoringTypeId: id } });
    if (used > 0) {
      return jsonError(409, "in_use", { message: "Bu puanlama tipi sorularda kullanılıyor, silinemez." });
    }

    await prisma.scoringType.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return jsonError(500, "server_error");
  }
}