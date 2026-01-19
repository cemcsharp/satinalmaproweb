import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionApi, getSessionUser } from "@/lib/apiAuth";
import { dispatchEmail, renderEmailTemplate } from "@/lib/mailer";
import { getSystemSettings } from "@/lib/settings";

// POST: Approve a supplier (tenant with isSupplier: true)
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requirePermissionApi(req, "admin");
        if (!authResult) {
            return NextResponse.json({ error: "forbidden" }, { status: 403 });
        }

        const session = await getSessionUser(req);
        const { id: supplierId } = await params;

        const supplier = await prisma.tenant.findUnique({
            where: { id: supplierId, isSupplier: true },
            include: {
                users: true
            }
        });

        if (!supplier) {
            return NextResponse.json({ error: "supplier_not_found" }, { status: 404 });
        }

        // Update supplier (tenant) status
        await prisma.tenant.update({
            where: { id: supplierId },
            data: {
                registrationStatus: "approved",
                isActive: true,
                approvedAt: new Date(),
                approvedById: session?.userId
            }
        });

        // Activate user accounts linked to this tenant
        await prisma.user.updateMany({
            where: { tenantId: supplierId },
            data: { isActive: true }
        });

        // Send approval email
        if (supplier.email) {
            const settings = await getSystemSettings();
            const emailHtml = renderEmailTemplate("generic", {
                title: "Tedarikçi Hesabınız Onaylandı",
                body: `
                    <p>Sayın ${supplier.contactName || supplier.name},</p>
                    <p>${settings.siteName} platformuna tedarikçi kaydınız onaylanmıştır.</p>
                    <p>Artık portala giriş yaparak açık taleplere teklif verebilirsiniz.</p>
                `,
                actionUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/portal/login`,
                actionText: "Portala Giriş Yap",
                footerText: `${settings.siteName} - ${settings.siteDescription}`
            });

            await dispatchEmail({
                to: supplier.email,
                subject: "✅ Tedarikçi Hesabınız Onaylandı",
                html: emailHtml,
                category: "supplier_approval"
            });
        }

        return NextResponse.json({
            ok: true,
            message: "Tedarikçi onaylandı ve bilgilendirildi."
        });
    } catch (error) {
        console.error("Approve supplier error:", error);
        return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
}
