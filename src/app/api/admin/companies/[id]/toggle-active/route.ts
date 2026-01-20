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

        const { id: tenantId } = await params;
        console.log(`[API] Toggling active for organization: ${tenantId}`);

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId }
        });

        if (!tenant) {
            console.warn(`[API] Organization not found for toggle: ${tenantId}`);
            return NextResponse.json({ error: "organization_not_found" }, { status: 404 });
        }

        const newActiveState = !tenant.isActive;

        // Transaction to update both Tenant and its Users
        const [updatedTenant] = await prisma.$transaction([
            prisma.tenant.update({
                where: { id: tenantId },
                data: { isActive: newActiveState }
            }),
            prisma.user.updateMany({
                where: { tenantId: tenantId },
                data: { isActive: newActiveState }
            })
        ]);

        console.log(`[API] Organization ${tenantId} and its users are now ${newActiveState ? "active" : "inactive"}`);

        return NextResponse.json({
            ok: true,
            active: updatedTenant.isActive,
            message: `Kuruluş ${updatedTenant.isActive ? "aktif" : "pasif"} duruma getirildi.`
        });
    } catch (error) {
        console.error("Toggle company active error:", error);
        return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
}
