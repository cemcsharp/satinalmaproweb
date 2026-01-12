import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionApi, getSessionUser } from "@/lib/apiAuth";
import { dispatchEmail, renderEmailTemplate } from "@/lib/mailer";

// POST: Approve a supplier
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authResult = await requirePermissionApi(req, "admin");
        if (authResult instanceof NextResponse) return authResult;

        const session = await getSessionUser();
        const supplierId = params.id;

        const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId },
            include: {
                users: true
            }
        });

        if (!supplier) {
            return NextResponse.json({ error: "supplier_not_found" }, { status: 404 });
        }

        // Update supplier status
        await prisma.supplier.update({
            where: { id: supplierId },
            data: {
                registrationStatus: "approved",
                active: true,
                approvedAt: new Date(),
                approvedById: session?.id
            }
        });

        // Activate user accounts
        await prisma.user.updateMany({
            where: { supplierId },
            data: { isActive: true }
        });

        // Send approval email
        if (supplier.email) {
            const emailHtml = renderEmailTemplate("generic", {
                title: "Tedarikçi Hesabınız Onaylandı",
                body: `
                    <p>Sayın ${supplier.contactName || supplier.name},</p>
                    <p>SatınalmaPRO platformuna tedarikçi kaydınız onaylanmıştır.</p>
                    <p>Artık portala giriş yaparak açık taleplere teklif verebilirsiniz.</p>
                `,
                actionUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/portal/login`,
                actionText: "Portala Giriş Yap",
                footerText: "SatınalmaPRO - B2B Satınalma Platformu"
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
