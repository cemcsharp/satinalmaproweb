
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

// GET: List Categories (Tree Structure)
export async function GET(req: NextRequest) {
    try {
        const categories = await prisma.supplierCategory.findMany({
            orderBy: { name: 'asc' }
        });

        // Build Tree
        const categoryMap = new Map();
        categories.forEach(cat => categoryMap.set(cat.id, { ...cat, children: [] }));

        const rootCategories: any[] = [];
        categories.forEach(cat => {
            if (cat.parentId) {
                const parent = categoryMap.get(cat.parentId);
                if (parent) parent.children.push(categoryMap.get(cat.id));
            } else {
                rootCategories.push(categoryMap.get(cat.id));
            }
        });

        return NextResponse.json(rootCategories);
    } catch (e: any) {
        return jsonError(500, e.message);
    }
}

// POST: Create Category
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, parentId } = body;

        if (!name) return jsonError(400, "Kategori adı zorunlu");

        const category = await prisma.supplierCategory.create({
            data: {
                name,
                parentId: parentId || null
            }
        });

        return NextResponse.json({ ok: true, category });
    } catch (e: any) {
        return jsonError(500, e.message);
    }
}

// PUT: Update Category
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, name, parentId } = body;

        if (!id || !name) return jsonError(400, "ID ve Kategori adı zorunlu");

        const updated = await prisma.supplierCategory.update({
            where: { id },
            data: {
                name,
                parentId: parentId || null // Allow moving categories
            }
        });

        return NextResponse.json({ ok: true, category: updated });
    } catch (e: any) {
        return jsonError(500, e.message);
    }
}

// DELETE: Remove Category
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return jsonError(400, "ID zorunlu");

        // Safety Verify: Check for children or suppliers
        const subCount = await prisma.supplierCategory.count({ where: { parentId: id } });
        if (subCount > 0) return jsonError(400, "Alt kategorisi olan bir kategori silinemez. Önce alt kategorileri silin/taşıyın.");

        const supplierCount = await prisma.supplier.count({ where: { categoryId: id } });
        if (supplierCount > 0) return jsonError(400, "Bu kategoriye bağlı tedarikçiler var. Önce tedarikçilerin kategorisini değiştirin.");

        await prisma.supplierCategory.delete({
            where: { id }
        });

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return jsonError(500, e.message);
    }
}
