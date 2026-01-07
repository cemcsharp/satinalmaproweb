import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { requirePermissionApi } from "@/lib/apiAuth";

/**
 * @swagger
 * /api/tedarikci:
 *   get:
 *     summary: Tedarikçi listesini getirir
 *     description: Filtreleme, sıralama ve sayfalama destekli tedarikçi listesi.
 *     tags: [Tedarikçi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: İsim, Vergi No, E-posta veya Telefon içinde arama yapar
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Aktif/Pasif durumuna göre filtreler
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Başlangıç tarihi
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Bitiş tarihi
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, date]
 *         description: Sıralama alanı
 *       - in: query
 *         name: sortDir
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sıralama yönü
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Sayfa numarası
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Sayfa başına kayıt sayısı
 *     responses:
 *       200:
 *         description: Tedarikçi listesi başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Supplier'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *       403:
 *         description: Yetkisiz erişim
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(req: NextRequest) {
  // Permission check: tedarikci:read required
  const user = await requirePermissionApi(req, "tedarikci:read");
  if (!user) return jsonError(403, "forbidden", { message: "Tedarikçi görüntüleme yetkiniz yok." });

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

/**
 * @swagger
 * /api/tedarikci:
 *   post:
 *     summary: Yeni tedarikçi oluşturur
 *     tags: [Tedarikçi]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tedarikçi adı
 *               taxId:
 *                 type: string
 *                 description: Vergi numarası
 *               contactName:
 *                 type: string
 *                 description: İlgili kişi adı
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               website:
 *                 type: string
 *               notes:
 *                 type: string
 *               categoryId:
 *                 type: string
 *                 description: Tedarikçi kategorisi ID'si
 *               active:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Tedarikçi başarıyla oluşturuldu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Supplier'
 *       400:
 *         description: Geçersiz veri girişi
 *       409:
 *         description: Çakışan veri (Örn. Aynı isim veya Vergi No)
 */
export async function POST(req: NextRequest) {
  try {
    // Permission check: tedarikci:create required
    const user = await requirePermissionApi(req, "tedarikci:create");
    if (!user) return jsonError(403, "forbidden", { message: "Tedarikçi oluşturma yetkiniz yok." });

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