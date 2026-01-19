import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionApi } from "@/lib/apiAuth";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requirePermissionApi(req, "admin");
        if (!authResult) {
            return NextResponse.json({ error: "forbidden" }, { status: 403 });
        }

        const { id: supplierId } = await params;
        console.log(`[API] Toggling active for supplier: ${supplierId}`);

        const supplier = await prisma.tenant.findUnique({
            where: { id: supplierId }
        });

        if (!supplier) {
            console.warn(`[API] Supplier (Tenant) not found for toggle: ${supplierId}`);
            return NextResponse.json({ error: "supplier_not_found" }, { status: 404 });
        }

        const newActiveStatus = !supplier.isActive;

        await prisma.$transaction([
            prisma.tenant.update({
                where: { id: supplierId },
                data: { isActive: newActiveStatus }
            }),
            prisma.user.updateMany({
                where: { tenantId: supplierId },
                data: { isActive: newActiveStatus }
            })
        ]);

        console.log(`[API] Supplier ${supplierId} and its users are now ${newActiveStatus ? "active" : "inactive"}`);

        return NextResponse.json({
            ok: true,
            active: newActiveStatus,
            message: `Tedarikçi ${newActiveStatus ? "aktif" : "pasif"} duruma getirildi.`
        });
    } catch (error) {
        console.error("Toggle supplier active error:", error);
        return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
}
