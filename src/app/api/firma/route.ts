import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { jsonError } from "@/lib/apiError";

// Company remote search with standard query params
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const q = searchParams.get("q") || "";
  const active = searchParams.get("active");
  const sortBy = (searchParams.get("sortBy") || "name") as "name" | "date";
  const sortDir = (searchParams.get("sortDir") || "asc") as "asc" | "desc";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));

  try {
    if (id) {
      const one = await prisma.tenant.findUnique({ where: { id, isBuyer: true } });
      if (!one) return jsonError(404, "not_found");
      return NextResponse.json(one);
    }
    const where: Prisma.TenantWhereInput = {
      AND: [
        { isBuyer: true },
        q
          ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
            ],
          }
          : {},
        active !== null && active !== "" ? { isActive: active === "true" } : {},
      ],
    };

    const orderBy: Prisma.TenantOrderByWithRelationInput = sortBy === "date" ? { id: sortDir } : { name: sortDir };

    const [items, total] = await Promise.all([
      prisma.tenant.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.tenant.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, pageSize });
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}
