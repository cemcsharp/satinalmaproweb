import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRoleApi } from "@/lib/apiAuth";
import { jsonError } from "@/lib/apiError";


// List all templates & create new template
export async function GET(req: NextRequest) {
  try {
    const admin = await ensureRoleApi(req, "admin");
    if (!admin) return jsonError(403, "forbidden");
    const items = await (prisma as unknown as { reportTemplate: { findMany: (args: any) => Promise<any[]> } }).reportTemplate.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ items, total: items.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonError(500, "server_error", { message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await ensureRoleApi(req, "admin");
    if (!admin) return jsonError(403, "forbidden");
    const body = await req.json();
    const name = String(body?.name || "").trim();
    const config = body?.config ?? null;
    if (!name || !config) return jsonError(400, "invalid_payload");
    const created = await (prisma as unknown as { reportTemplate: { create: (args: any) => Promise<any> } }).reportTemplate.create({
      data: { name, config, ownerId: admin.id },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonError(500, "server_error", { message });
  }
}