import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRoleApi } from "@/lib/apiAuth";
import { jsonError } from "@/lib/apiError";


export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await ensureRoleApi(req, "admin");
    if (!admin) return jsonError(403, "forbidden");
    const { id } = await context.params;
    const item = await (prisma as any).reportTemplate.findUnique({ where: { id } });
    if (!item) return jsonError(404, "not_found");
    return NextResponse.json(item);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonError(500, "server_error", { message });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await ensureRoleApi(req, "admin");
    if (!admin) return jsonError(403, "forbidden");
    const body = await req.json();
    const { id } = await context.params;
    const existing = await (prisma as unknown as { reportTemplate: { findUnique: (args: any) => Promise<any> } }).reportTemplate.findUnique({ where: { id } });
    if (!existing) return jsonError(404, "not_found");
    const data: Record<string, unknown> = {};
    if (typeof body?.name === "string") data.name = body.name.trim();
    if (body?.config !== undefined) data.config = body.config;
    const updated = await (prisma as unknown as { reportTemplate: { update: (args: any) => Promise<any> } }).reportTemplate.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonError(500, "server_error", { message });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await ensureRoleApi(req, "admin");
    if (!admin) return jsonError(403, "forbidden");
    const { id } = await context.params;
    const tpl = await (prisma as unknown as { reportTemplate: { findUnique: (args: any) => Promise<any> } }).reportTemplate.findUnique({ where: { id } });
    if (!tpl) return jsonError(404, "not_found");
    if (!tpl.ownerId) return jsonError(403, "forbidden");
    await (prisma as unknown as { reportTemplate: { delete: (args: any) => Promise<any> } }).reportTemplate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonError(500, "server_error", { message });
  }
}