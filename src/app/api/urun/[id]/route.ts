import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

// GET: Tek ürün detayı + fiyat geçmişi
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { getUserWithPermissions } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");

        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const includePriceHistory = searchParams.get("priceHistory") === "true";

        const product = await prisma.product.findFirst({
            where: {
                id,
                tenantId: user.isSuperAdmin ? undefined : user.tenantId
            },
            include: {
                category: { select: { id: true, name: true, code: true } },
                preferredSupplier: { select: { id: true, name: true, email: true } }
            }
        });

        if (!product) {
            return jsonError(404, "not_found");
        }

        // Tenant kontrolü
        if (!user.isSuperAdmin && product.tenantId !== user.tenantId) {
            return jsonError(403, "forbidden");
        }

        // Sadece temel bilgi isteniyorsa
        if (!includePriceHistory) {
            return NextResponse.json(product);
        }

        // Fiyat geçmişi - SKU üzerinden sipariş kalemlerini bul (Tenant bazlı)
        const priceHistory = await prisma.orderItem.findMany({
            where: {
                sku: product.sku,
                order: { tenantId: user.isSuperAdmin ? undefined : user.tenantId }
            },
            include: {
                order: {
                    select: {
                        id: true,
                        barcode: true,
                        createdAt: true,
                        supplier: { select: { id: true, name: true } },
                        currency: { select: { label: true } }
                    }
                }
            },
            orderBy: { order: { createdAt: 'desc' } },
            take: 50
        });

        // İstatistikler hesapla
        const prices = priceHistory.map(h => Number(h.unitPrice));
        const stats = prices.length > 0 ? {
            purchaseCount: prices.length,
            totalQuantity: priceHistory.reduce((sum, h) => sum + Number(h.quantity), 0),
            minPrice: Math.min(...prices),
            maxPrice: Math.max(...prices),
            avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length * 100) / 100,
            lastPrice: prices[0] || null,
            lastPurchaseDate: priceHistory[0]?.order?.createdAt || null,
            lastSupplier: priceHistory[0]?.order?.supplier?.name || null
        } : null;

        // Tedarikçi bazlı özet
        const supplierMap = new Map<string, {
            name: string;
            count: number;
            totalQty: number;
            avgPrice: number;
            lastDate: Date | null;
        }>();

        for (const item of priceHistory) {
            const suppId = item.order?.supplier?.id;
            const suppName = item.order?.supplier?.name;
            if (!suppId || !suppName) continue;

            const existing = supplierMap.get(suppId);
            if (existing) {
                existing.count++;
                existing.totalQty += Number(item.quantity);
                existing.avgPrice = Math.round(
                    ((existing.avgPrice * (existing.count - 1) + Number(item.unitPrice)) / existing.count) * 100
                ) / 100;
            } else {
                supplierMap.set(suppId, {
                    name: suppName,
                    count: 1,
                    totalQty: Number(item.quantity),
                    avgPrice: Number(item.unitPrice),
                    lastDate: item.order?.createdAt || null
                });
            }
        }

        return NextResponse.json({
            product,
            priceHistory: priceHistory.map(h => ({
                id: h.id,
                date: h.order?.createdAt,
                orderBarcode: h.order?.barcode,
                orderId: h.order?.id,
                supplierName: h.order?.supplier?.name,
                supplierId: h.order?.supplier?.id,
                quantity: Number(h.quantity),
                unitPrice: Number(h.unitPrice),
                currency: h.order?.currency?.label || 'TRY'
            })),
            stats,
            supplierSummary: Array.from(supplierMap.values())
        });

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
        // SKU benzersizlik kontrolü (kendi dışında ve tenant bazlı)
        if (sku) {
            const existing = await prisma.product.findFirst({
                where: {
                    sku,
                    NOT: { id },
                    tenantId: user.isSuperAdmin ? undefined : user.tenantId
                }
            });
            if (existing) {
                return jsonError(400, "duplicate_sku", { message: "Bu ürün kodu zaten kullanılıyor." });
            }
        }

        const product = await prisma.product.update({
            where: {
                id,
                tenantId: user.isSuperAdmin ? undefined : user.tenantId
            },
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
            where: {
                id,
                tenantId: user.isSuperAdmin ? undefined : user.tenantId
            },
            data: { active: false }
        });

        return NextResponse.json({ ok: true });

    } catch (e: any) {
        console.error("Product DELETE Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}
