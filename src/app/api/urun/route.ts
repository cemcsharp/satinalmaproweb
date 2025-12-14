import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

// GET: Ürün listesi veya arama
export async function GET(req: NextRequest) {
    try {
        const { getUserWithPermissions } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const categoryId = searchParams.get("categoryId");
        const active = searchParams.get("active");
        const page = Math.max(1, Number(searchParams.get("page") || 1));
        const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 50)));
        const skip = (page - 1) * pageSize;

        // Build where clause
        const where: any = {};

        if (search) {
            where.OR = [
                { sku: { contains: search, mode: "insensitive" } },
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } }
            ];
        }

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (active !== null && active !== undefined && active !== "") {
            where.active = active === "true";
        }

        const [items, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: [{ name: "asc" }],
                include: {
                    category: { select: { id: true, name: true, code: true } },
                    preferredSupplier: { select: { id: true, name: true } }
                }
            }),
            prisma.product.count({ where })
        ]);

        return NextResponse.json({
            items,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize)
        });

    } catch (e: any) {
        console.error("Product GET Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}

// POST: Yeni ürün oluştur
export async function POST(req: NextRequest) {
    try {
        const { getUserWithPermissions } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");

        // Sadece admin ve satınalma müdürü ürün oluşturabilir
        const allowedRoles = ["admin", "satinalma_muduru"];
        if (!user.isAdmin && !allowedRoles.includes(user.role)) {
            return jsonError(403, "forbidden", { message: "Ürün ekleme yetkiniz yok." });
        }

        const body = await req.json();
        const { sku, name, description, categoryId, defaultUnit, estimatedPrice, currency, preferredSupplierId, minStock, leadTimeDays } = body;

        if (!sku || !name) {
            return jsonError(400, "missing_fields", { message: "Ürün kodu ve adı zorunludur." });
        }

        // SKU benzersizlik kontrolü
        const existing = await prisma.product.findUnique({ where: { sku } });
        if (existing) {
            return jsonError(400, "duplicate_sku", { message: "Bu ürün kodu zaten kullanılıyor." });
        }

        const product = await prisma.product.create({
            data: {
                sku,
                name,
                description,
                categoryId: categoryId || null,
                defaultUnit,
                estimatedPrice: estimatedPrice ? Number(estimatedPrice) : null,
                currency: currency || "TRY",
                preferredSupplierId: preferredSupplierId || null,
                minStock: minStock ? Number(minStock) : null,
                leadTimeDays: leadTimeDays ? Number(leadTimeDays) : null,
                active: true
            },
            include: {
                category: { select: { id: true, name: true, code: true } }
            }
        });

        return NextResponse.json(product, { status: 201 });

    } catch (e: any) {
        console.error("Product POST Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}

// PUT: Toplu import (Excel/CSV)
export async function PUT(req: NextRequest) {
    try {
        const { getUserWithPermissions } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");

        // Sadece admin import yapabilir
        if (!user.isAdmin) {
            return jsonError(403, "forbidden", { message: "Import yetkisi yalnızca admin'e aittir." });
        }

        const body = await req.json();
        const { products } = body; // Array of { sku, name, categoryCode, defaultUnit, estimatedPrice, ... }

        if (!Array.isArray(products) || products.length === 0) {
            return jsonError(400, "missing_fields", { message: "Ürün listesi boş." });
        }

        const results = { created: 0, updated: 0, errors: [] as string[] };

        for (const p of products) {
            try {
                if (!p.sku || !p.name) {
                    results.errors.push(`Satır atlandı: SKU veya Ad eksik`);
                    continue;
                }

                // Kategori bul (varsa)
                let categoryId = null;
                if (p.categoryCode) {
                    const cat = await prisma.productCategory.findUnique({ where: { code: p.categoryCode } });
                    if (cat) categoryId = cat.id;
                }

                // Upsert
                const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
                if (existing) {
                    await prisma.product.update({
                        where: { sku: p.sku },
                        data: {
                            name: p.name,
                            description: p.description,
                            categoryId,
                            defaultUnit: p.defaultUnit,
                            estimatedPrice: p.estimatedPrice ? Number(p.estimatedPrice) : null,
                            currency: p.currency || "TRY",
                            active: p.active !== false
                        }
                    });
                    results.updated++;
                } else {
                    await prisma.product.create({
                        data: {
                            sku: p.sku,
                            name: p.name,
                            description: p.description,
                            categoryId,
                            defaultUnit: p.defaultUnit,
                            estimatedPrice: p.estimatedPrice ? Number(p.estimatedPrice) : null,
                            currency: p.currency || "TRY",
                            active: true
                        }
                    });
                    results.created++;
                }
            } catch (err: any) {
                results.errors.push(`SKU ${p.sku}: ${err.message}`);
            }
        }

        return NextResponse.json({ ok: true, ...results });

    } catch (e: any) {
        console.error("Product Import Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}
