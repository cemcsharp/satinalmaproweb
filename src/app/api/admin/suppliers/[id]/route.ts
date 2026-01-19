import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionApi } from "@/lib/apiAuth";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requirePermissionApi(req, "admin");
        if (!authResult) {
            return NextResponse.json({ error: "forbidden" }, { status: 403 });
        }

        const { id: supplierId } = await params;

        // Check for related records that would prevent deletion
        const [orderCount, rfqCount, productCount] = await Promise.all([
            prisma.order.count({ where: { supplierId } }),
            prisma.rfqSupplier.count({ where: { supplierId } }),
            prisma.product.count({ where: { preferredSupplierId: supplierId } }),
        ]);

        if (orderCount > 0 || rfqCount > 0 || productCount > 0) {
            return NextResponse.json({
                error: "supplier_has_records",
                message: `Bu tedarikçinin ${orderCount} sipariş, ${rfqCount} ihale katılımı ve ${productCount} ürün kaydı bulunmaktadır. Önce bu kayıtları silmeniz veya başka bir tedarikçiye atamanız gerekir.`
            }, { status: 409 });
        }

        // Delete associated users and the tenant (supplier)
        await prisma.$transaction([
            prisma.user.deleteMany({ where: { tenantId: supplierId } }),
            prisma.tenant.delete({ where: { id: supplierId } })
        ]);

        return NextResponse.json({
            ok: true,
            message: "Tedarikçi ve bağlı kullanıcı hesapları başarıyla silindi."
        });
    } catch (error) {
        console.error("Delete supplier error:", error);
        return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
}
