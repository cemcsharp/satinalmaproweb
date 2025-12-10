import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRoleApi } from "@/lib/apiAuth";

export async function GET(req: NextRequest) {
  const admin = await ensureRoleApi(req, "admin");
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const take = Math.min(100, Math.max(1, Number(new URL(req.url).searchParams.get("take") || 20)));
  const rows = await prisma.emailLog.findMany({ orderBy: { createdAt: "desc" }, take });
  return NextResponse.json({ items: rows });
}
