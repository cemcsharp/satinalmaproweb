import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// Standardized supplier list with filtering, sorting, and pagination
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const active = searchParams.get("active");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const sortBy = (searchParams.get("sortBy") || "name") as "name" | "date";
  const sortDir = (searchParams.get("sortDir") || "asc") as "asc" | "desc";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));

  try {
    const where: any = {
      AND: [
        q
          ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { taxId: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          }
          : {},
        active !== null && active !== "" ? { active: active === "true" } : {},
        dateFrom || dateTo
          ? {
            createdAt: {
              gte: dateFrom ? new Date(dateFrom) : undefined,
              lte: dateTo ? new Date(dateTo) : undefined,
            },
          }
          : {},
      ],
    };

    const orderBy =
      sortBy === "date"
        ? ({ createdAt: sortDir } as any)
        : ({ name: sortDir } as any);

    const [items, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { category: true }
      }),
      prisma.supplier.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, pageSize });
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return jsonError(401, "unauthorized");
    const body = await req.json();
    const name = String(body?.name || "").trim();
    if (!name) return jsonError(400, "name_required");
    const taxId = body?.taxId ? String(body.taxId).trim() : null;
    const contactName = body?.contactName ? String(body.contactName).trim() : null;
    const email = body?.email ? String(body.email).trim() : null;
    const phone = body?.phone ? String(body.phone).trim() : null;
    const address = body?.address ? String(body.address).trim() : null;
    const website = body?.website ? String(body.website).trim() : null;
    const notes = body?.notes ? String(body.notes).trim() : null;
    const categoryId = body?.categoryId ? String(body.categoryId).trim() : null;

    const errors: string[] = [];
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("invalid_email");
    if (phone && phone.replace(/\D/g, "").length < 7) errors.push("invalid_phone");
    if (taxId && taxId.replace(/\D/g, "").length < 8) errors.push("invalid_taxId");
    if (errors.length) return jsonError(400, "validation_failed", { details: errors });
    const created = await prisma.supplier.create({
      data: {
        name,
        active: Boolean(body?.active ?? true),
        taxId,
        contactName,
        email,
        phone,
        address,
        website,
        notes,
        categoryId,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      const target = Array.isArray(e?.meta?.target) ? e.meta.target[0] : e?.meta?.target || "unknown";
      const field = typeof target === "string" ? target : "unknown";
      return jsonError(409, "duplicate", { details: { field } });
    }
    return jsonError(500, "server_error", { message: e?.message });
  }
}