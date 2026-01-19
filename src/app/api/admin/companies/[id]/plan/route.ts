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
        const { plan, planExpiresAt } = await req.json();

        console.log(`[API] Updating plan for organization ${tenantId}: plan=${plan}, expiry=${planExpiresAt}`);

        const updatedTenant = await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                plan: plan || "free",
                planExpiresAt: planExpiresAt ? new Date(planExpiresAt) : null
            }
        });

        console.log(`[API] Organization ${tenantId} plan updated successfully`);

        return NextResponse.json({
            ok: true,
            company: updatedTenant,
            message: "Kuruluş paket bilgileri güncellendi."
        });
    } catch (error) {
        console.error("Update company plan error:", error);
        return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
}
