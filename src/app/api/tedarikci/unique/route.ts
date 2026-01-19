import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { jsonError } from "@/lib/apiError";

// Check uniqueness for supplier fields: name, email, taxId
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const field = (url.searchParams.get("field") || "").trim();
  const value = (url.searchParams.get("value") || "").trim();
  const excludeId = (url.searchParams.get("excludeId") || "").trim();

  try {
    const session = await getServerSession(authOptions);
    if (!session) return jsonError(401, "unauthorized");
    if (!field || !value) return jsonError(400, "invalid_query");
    if (!["name", "email", "taxId"].includes(field)) return jsonError(400, "invalid_field");

    const where: any = { [field]: value, isSupplier: true };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const existing = await prisma.tenant.findFirst({ where, select: { id: true } });
    return NextResponse.json({ exists: Boolean(existing) });
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}