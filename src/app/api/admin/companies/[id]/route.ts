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

        const { id: tenantId } = await params;

        // Check for related records that would prevent deletion
        const [orderCount, rfqCount] = await Promise.all([
            prisma.order.count({ where: { companyId: tenantId } }),
            prisma.rfq.count({ where: { companyId: tenantId } }),
        ]);

        if (orderCount > 0 || rfqCount > 0) {
            return NextResponse.json({
                error: "company_has_records",
                message: `Bu firmanın ${orderCount} sipariş ve ${rfqCount} ihale kaydı bulunmaktadır. Önce bu kayıtları silmeniz gerekir.`
            }, { status: 409 });
        }

        // Delete associated users and then the tenant
        await prisma.$transaction([
            prisma.user.deleteMany({ where: { tenantId } }),
            prisma.tenant.delete({ where: { id: tenantId } })
        ]);

        return NextResponse.json({
            ok: true,
            message: "Firma ve bağlı kullanıcı hesapları başarıyla silindi."
        });
    } catch (error) {
        console.error("Delete company error:", error);
        return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
}
