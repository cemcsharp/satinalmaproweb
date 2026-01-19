import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionApi } from "@/lib/apiAuth";
import { dispatchEmail, renderEmailTemplate } from "@/lib/mailer";
import { getSystemSettings } from "@/lib/settings";

// POST: Reject a supplier registration
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

        const supplier = await prisma.tenant.findUnique({
            where: { id: supplierId, isSupplier: true }
        });

        if (!supplier) {
            return NextResponse.json({ error: "supplier_not_found" }, { status: 404 });
        }

        // Update supplier status
        await prisma.tenant.update({
            where: { id: supplierId },
            data: {
                registrationStatus: "rejected",
                isActive: false
            }
        });

        // Send rejection email
        if (supplier.email) {
            const settings = await getSystemSettings();
            const emailHtml = renderEmailTemplate("generic", {
                title: "Tedarikçi Başvurunuz Hakkında",
                body: `
                    <p>Sayın ${supplier.contactName || supplier.name},</p>
                    <p>${settings.siteName} platformuna tedarikçi başvurunuz değerlendirilmiştir.</p>
                    <p>Maalesef başvurunuz şu an için onaylanamamıştır.</p>
                    <p>Detaylı bilgi için bizimle iletişime geçebilirsiniz.</p>
                `,
                footerText: `${settings.siteName} - ${settings.siteDescription}`
            });

            await dispatchEmail({
                to: supplier.email,
                subject: "Tedarikçi Başvurunuz Hakkında",
                html: emailHtml,
                category: "supplier_rejection"
            });
        }

        return NextResponse.json({
            ok: true,
            message: "Tedarikçi başvurusu reddedildi."
        });
    } catch (error) {
        console.error("Reject supplier error:", error);
        return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
}
