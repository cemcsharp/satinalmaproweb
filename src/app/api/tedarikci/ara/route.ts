import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ items: [] });
    }
    const items = await prisma.supplier.findMany({
      where: { name: { contains: q, mode: "insensitive" }, active: true },
      select: { id: true, name: true },
      take: 10,
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ items });
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}