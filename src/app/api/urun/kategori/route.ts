import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

// GET: Kategori listesi (hiyerarşik veya düz)
export async function GET(req: NextRequest) {
    try {
        const { getUserWithPermissions } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");

        const { searchParams } = new URL(req.url);
        const flat = searchParams.get("flat") === "true";
        const active = searchParams.get("active");

        const where: any = {};
        if (active !== null && active !== undefined && active !== "") {
            where.active = active === "true";
        }

        if (flat) {
            // Düz liste
            const categories = await prisma.productCategory.findMany({
                where,
                orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
                include: { _count: { select: { products: true } } }
            });
            return NextResponse.json({ items: categories });
        } else {
            // Hiyerarşik (sadece kök kategoriler ve çocukları)
            const rootCategories = await prisma.productCategory.findMany({
                where: { ...where, parentId: null },
                orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
                include: {
                    _count: { select: { products: true } },
                    children: {
                        where: active === "true" ? { active: true } : {},
                        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
                        include: {
                            _count: { select: { products: true } },
                            children: {
                                where: active === "true" ? { active: true } : {},
                                orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
                                include: { _count: { select: { products: true } } }
                            }
                        }
                    }
                }
            });
            return NextResponse.json({ items: rootCategories });
        }

    } catch (e: any) {
        console.error("Category GET Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}

// POST: Yeni kategori oluştur
export async function POST(req: NextRequest) {
    try {
        const { getUserWithPermissions } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");

        // Sadece admin kategori oluşturabilir
        if (!user.isAdmin) {
            return jsonError(403, "forbidden", { message: "Kategori ekleme yetkisi yalnızca admin'e aittir." });
        }

        const body = await req.json();
        const { name, code, description, parentId, sortOrder } = body;

        if (!name || !code) {
            return jsonError(400, "missing_fields", { message: "Kategori adı ve kodu zorunludur." });
        }

        // Kod benzersizlik kontrolü
        const existing = await prisma.productCategory.findUnique({ where: { code } });
        if (existing) {
            return jsonError(400, "duplicate_code", { message: "Bu kategori kodu zaten kullanılıyor." });
        }

        const category = await prisma.productCategory.create({
            data: {
                name,
                code,
                description,
                parentId: parentId || null,
                sortOrder: sortOrder || 0,
                active: true
            }
        });

        return NextResponse.json(category, { status: 201 });

    } catch (e: any) {
        console.error("Category POST Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}

// PUT: Kategori güncelle
export async function PUT(req: NextRequest) {
    try {
        const { getUserWithPermissions } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");

        if (!user.isAdmin) {
            return jsonError(403, "forbidden");
        }

        const body = await req.json();
        const { id, name, code, description, parentId, sortOrder, active } = body;

        if (!id) {
            return jsonError(400, "missing_id");
        }

        // Kod benzersizlik kontrolü (kendi dışında)
        if (code) {
            const existing = await prisma.productCategory.findFirst({
                where: { code, NOT: { id } }
            });
            if (existing) {
                return jsonError(400, "duplicate_code", { message: "Bu kategori kodu zaten kullanılıyor." });
            }
        }

        const category = await prisma.productCategory.update({
            where: { id },
            data: {
                name,
                code,
                description,
                parentId: parentId || null,
                sortOrder: sortOrder ?? undefined,
                active: active ?? undefined
            }
        });

        return NextResponse.json(category);

    } catch (e: any) {
        console.error("Category PUT Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}

// DELETE: Kategori sil (soft delete - pasifleştir)
export async function DELETE(req: NextRequest) {
    try {
        const { getUserWithPermissions } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");

        if (!user.isAdmin) {
            return jsonError(403, "forbidden");
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return jsonError(400, "missing_id");
        }

        // Soft delete: sadece pasifleştir
        await prisma.productCategory.update({
            where: { id },
            data: { active: false }
        });

        return NextResponse.json({ ok: true });

    } catch (e: any) {
        console.error("Category DELETE Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}
