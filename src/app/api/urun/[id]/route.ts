import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

// GET: Tek ürün detayı
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { getUserWithPermissions } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");

        const { id } = await params;

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                category: { select: { id: true, name: true, code: true } },
                preferredSupplier: { select: { id: true, name: true, email: true } }
            }
        });

        if (!product) {
            return jsonError(404, "not_found");
        }

        return NextResponse.json(product);

    } catch (e: any) {
        console.error("Product Detail GET Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}

// PUT: Ürün güncelle
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { getUserWithPermissions } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");

        const allowedRoles = ["admin", "satinalma_muduru"];
        if (!user.isAdmin && !allowedRoles.includes(user.role)) {
            return jsonError(403, "forbidden");
        }

        const { id } = await params;
        const body = await req.json();
        const { sku, name, description, categoryId, defaultUnit, estimatedPrice, currency, preferredSupplierId, minStock, leadTimeDays, active } = body;

        // SKU benzersizlik kontrolü (kendi dışında)
        if (sku) {
            const existing = await prisma.product.findFirst({
                where: { sku, NOT: { id } }
            });
            if (existing) {
                return jsonError(400, "duplicate_sku", { message: "Bu ürün kodu zaten kullanılıyor." });
            }
        }

        const product = await prisma.product.update({
            where: { id },
            data: {
                sku,
                name,
                description,
                categoryId: categoryId || null,
                defaultUnit,
                estimatedPrice: estimatedPrice !== undefined ? Number(estimatedPrice) : undefined,
                currency,
                preferredSupplierId: preferredSupplierId || null,
                minStock: minStock !== undefined ? Number(minStock) : undefined,
                leadTimeDays: leadTimeDays !== undefined ? Number(leadTimeDays) : undefined,
                active: active ?? undefined
            },
            include: {
                category: { select: { id: true, name: true, code: true } }
            }
        });

        return NextResponse.json(product);

    } catch (e: any) {
        console.error("Product PUT Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}

// DELETE: Ürün sil (soft delete)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { getUserWithPermissions } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");

        if (!user.isAdmin) {
            return jsonError(403, "forbidden");
        }

        const { id } = await params;

        await prisma.product.update({
            where: { id },
            data: { active: false }
        });

        return NextResponse.json({ ok: true });

    } catch (e: any) {
        console.error("Product DELETE Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}
