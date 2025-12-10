import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureAdminApi } from "@/lib/apiAuth";
import { jsonError } from "@/lib/apiError";

export async function GET(req: NextRequest) {
  try {
    const admin = await ensureAdminApi(req);
    if (!admin) return jsonError(403, "forbidden");

    const settings = await prisma.smtpSetting.findMany({
      orderBy: { createdAt: "asc" }
    });

    // Mask passwords
    const masked = settings.map(s => ({
      ...s,
      pass: s.pass ? "********" : ""
    }));

    return NextResponse.json(masked);
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
    const { key, host, port, user, pass, from, secure, isDefault } = body;

    if (!key || !host || !port || !user || !from) return jsonError(400, "missing_fields");

    // If isDefault is true, unset others
    if (isDefault) {
      await prisma.smtpSetting.updateMany({ data: { isDefault: false } });
    }

    const setting = await prisma.smtpSetting.create({
      data: {
        key,
        name: body.name || key,
        host,
        port: Number(port),
        user,
        pass, // In real app, encrypt this
        from,
        secure: Boolean(secure),
        isDefault: Boolean(isDefault),
        active: true
      }
    });

    return NextResponse.json({ ...setting, pass: "********" }, { status: 201 });
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
    const { id, pass, ...rest } = body;

    if (!id) return jsonError(400, "id_required");

    if (rest.isDefault) {
      await prisma.smtpSetting.updateMany({ where: { id: { not: id } }, data: { isDefault: false } });
    }

    const data: any = { ...rest };
    if (pass && pass !== "********") {
      data.pass = pass;
    }

    const setting = await prisma.smtpSetting.update({
      where: { id },
      data
    });

    return NextResponse.json({ ...setting, pass: "********" });
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

    await prisma.smtpSetting.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return jsonError(500, "server_error");
  }
}
