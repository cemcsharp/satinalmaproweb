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

        const updatedTenant = await prisma.tenant.update({
            where: { id: tenantId },
            data: { isActive: !tenant.isActive }
        });

        console.log(`[API] Organization ${tenantId} is now ${updatedTenant.isActive ? "active" : "inactive"}`);

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
