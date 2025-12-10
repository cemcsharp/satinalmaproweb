import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dispatchEmail, renderEmailTemplate } from "@/lib/mailer";

/**
 * Cron endpoint for sending evaluation reminder emails
 * Should be called daily via external scheduler (e.g., Vercel Cron, Railway, etc.)
 * 
 * Sends reminders for orders that:
 * 1. Are in "Tamamlandı" status
 * 2. Have no evaluation yet
 * 3. Were completed more than 7 days ago
 */
export async function GET(req: NextRequest) {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Find completed orders without evaluations that are older than 7 days
        const pendingOrders = await prisma.order.findMany({
            where: {
                status: {
                    label: { contains: "Tamamlan" }
                },
                evaluations: {
                    none: {}
                },
                createdAt: {
                    lte: sevenDaysAgo
                }
            },
            include: {
                supplier: true,
                request: {
                    include: {
                        unit: true,
                        owner: true
                    }
                }
            },
            take: 50 // Limit to prevent timeouts
        });

        const origin = (req as any)?.nextUrl?.origin || "https://example.com";
        const sentEmails: string[] = [];
        const errors: string[] = [];

        for (const order of pendingOrders) {
            try {
                const evalLink = `${origin}/tedarikci/degerlendirme?orderId=${encodeURIComponent(order.id)}`;
                const supplierName = order.supplier?.name || "Tedarikçi";
                const unitLabel = (order.request as any)?.unit?.label || "";
                const barcode = order.barcode;

                const daysSinceComplete = Math.ceil((Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24));

                const subject = unitLabel
                    ? `⏰ Hatırlatma: Tedarikçi Değerlendirmesi Bekliyor – ${supplierName} – ${unitLabel}`
                    : `⏰ Hatırlatma: Tedarikçi Değerlendirmesi Bekliyor – ${supplierName}`;

                const fields = [
                    { label: "Sipariş No", value: barcode },
                    { label: "Tedarikçi", value: supplierName },
                    ...(unitLabel ? [{ label: "Birim", value: unitLabel }] : []),
                    { label: "Tamamlanma Tarihi", value: order.createdAt.toLocaleDateString("tr-TR") },
                    { label: "Bekleyen Süre", value: `${daysSinceComplete} gündür değerlendirme bekliyor` },
                ];

                const html = renderEmailTemplate("detail", {
                    title: "Tedarikçi Değerlendirmesi Hatırlatması",
                    intro: `"${barcode}" numaralı sipariş için "${supplierName}" tedarikçi değerlendirmesi henüz yapılmadı. Lütfen en kısa sürede değerlendirmenizi tamamlayınız.`,
                    fields,
                    items: [],
                    actionUrl: evalLink,
                    actionText: "Şimdi Değerlendir"
                });

                // Collect emails to send
                const emails: string[] = [];
                if ((order.request as any)?.unitEmail) emails.push(String((order.request as any).unitEmail));
                if (order.request?.owner?.email) emails.push(String(order.request.owner.email));

                for (const to of Array.from(new Set(emails)).filter(Boolean)) {
                    await dispatchEmail({ to, subject, html, category: "evaluation_reminder" });
                    sentEmails.push(`${to}:${barcode}`);
                }
            } catch (e: any) {
                errors.push(`${order.barcode}: ${e?.message || "unknown"}`);
            }
        }

        return NextResponse.json({
            ok: true,
            checkedOrders: pendingOrders.length,
            sentEmails: sentEmails.length,
            details: sentEmails,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (e: any) {
        console.error("Evaluation reminder cron error:", e);
        return NextResponse.json({ ok: false, error: e?.message || "unknown" }, { status: 500 });
    }
}
