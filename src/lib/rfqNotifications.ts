import { prisma } from "@/lib/db";
import { dispatchEmail, renderEmailTemplate } from "@/lib/mailer";
import { getSystemSettings, defaultSettings } from "@/lib/settings";

/**
 * Yeni bir RFQ yayınlandığında ilgili kategorideki tedarikçilere bildirim gönderir
 */
export async function notifySuppliersByCategory(rfqId: string) {
    try {
        const rfq = await prisma.rfq.findUnique({
            where: { id: rfqId },
            include: {
                items: {
                    include: {
                        category: true
                    }
                }
            }
        });

        if (!rfq) {
            console.error("RFQ not found for notification:", rfqId);
            return;
        }

        // Get unique category IDs from RFQ items
        const categoryIds = [...new Set(
            rfq.items
                .map(item => item.categoryId)
                .filter((id): id is string => id !== null)
        )];

        if (categoryIds.length === 0) {
            console.log("No categories found for RFQ, skipping notification");
            return;
        }

        // Find suppliers in these categories (via primary category OR category mappings)
        const suppliers = await prisma.supplier.findMany({
            where: {
                active: true,
                registrationStatus: "approved",
                email: {
                    not: null
                },
                OR: [
                    // Primary category match
                    {
                        categoryId: {
                            in: categoryIds
                        }
                    },
                    // Category mapping match
                    {
                        categoryId: {
                            in: categoryIds
                        }
                    }
                ]
            }
        });

        if (suppliers.length === 0) {
            console.log("No suppliers found for categories:", categoryIds);
            return;
        }

        // Prepare email content
        const categoryNames = rfq.items
            .map(item => item.category?.name)
            .filter(Boolean)
            .join(", ");

        const deadline = rfq.deadline
            ? new Date(rfq.deadline).toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric"
            })
            : "Belirtilmemiş";

        // Get system settings for footer
        const settings = await getSystemSettings();
        const footerText = `${settings.siteName} - ${settings.siteDescription}`;

        // Send emails to each supplier
        for (const supplier of suppliers) {
            if (!supplier.email) continue;

            try {
                const emailHtml = renderEmailTemplate("generic", {
                    title: `Yeni Teklif Talebi: ${rfq.rfxCode}`,
                    body: `
                        <p>Sayın ${supplier.name || "Tedarikçi"},</p>
                        <p>Kategorinize uygun yeni bir teklif talebi yayınlandı:</p>
                        <table style="width:100%;margin:16px 0;border-collapse:collapse;">
                            <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b;">Talep Kodu:</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:600;">${rfq.rfxCode}</td></tr>
                            <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b;">Başlık:</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:600;">${rfq.title}</td></tr>
                            <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b;">Kategori:</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">${categoryNames || "Genel"}</td></tr>
                            <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b;">Kalem Sayısı:</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">${rfq.items.length}</td></tr>
                            <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b;">Son Teklif Tarihi:</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#dc2626;">${deadline}</td></tr>
                        </table>
                        <p>Teklif vermek için aşağıdaki butona tıklayarak portala gidin.</p>
                    `,
                    actionUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/portal/rfq/marketplace`,
                    actionText: "Portala Git",
                    footerText: footerText
                });

                await dispatchEmail({
                    to: supplier.email,
                    subject: `📋 Yeni Teklif Talebi: ${rfq.rfxCode}`,
                    html: emailHtml,
                    category: "rfq_notification"
                });

                console.log(`Notification sent to supplier: ${supplier.email}`);
            } catch (emailError) {
                console.error(`Failed to send notification to ${supplier.email}:`, emailError);
            }
        }

        console.log(`Notifications sent for RFQ ${rfq.rfxCode} to ${suppliers.length} suppliers`);
    } catch (error) {
        console.error("Error in notifySuppliersByCategory:", error);
    }
}

/**
 * RFQ durumu OPEN olarak ayarlandığında çağrılır
 */
export async function publishRfqAndNotify(rfqId: string) {
    try {
        // Update RFQ status to OPEN
        await prisma.rfq.update({
            where: { id: rfqId },
            data: { status: "OPEN" }
        });

        // Notify suppliers in the background
        notifySuppliersByCategory(rfqId).catch(console.error);

        return { success: true };
    } catch (error) {
        console.error("Error publishing RFQ:", error);
        return { success: false, error };
    }
}
