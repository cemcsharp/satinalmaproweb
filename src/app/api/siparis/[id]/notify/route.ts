import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dispatchEmail, renderEmailTemplate } from "@/lib/mailer";
import { jsonError } from "@/lib/apiError";
import { getUserWithPermissions } from "@/lib/apiAuth";

/**
 * POST /api/siparis/[id]/notify
 * Manuel olarak tedarikçiye sipariş bildirimi gönderir
 */
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const user = await getUserWithPermissions(req);
    if (!user) return jsonError(401, "unauthorized");

    const { id } = await context.params;
    const orderId = String(id || "").trim();
    if (!orderId) return jsonError(404, "not_found");

    // Security Check: Only Admin or Satinalma can send notifications
    const isSatinalma = user.unitLabel?.toLocaleLowerCase("tr-TR").includes("satınalma") || user.unitLabel?.toLowerCase().includes("satinlama");
    const hasFullAccess = user.isAdmin || (user as any).role === "admin" || isSatinalma;

    if (!hasFullAccess) {
        return jsonError(403, "forbidden", { message: "Tedarikçiye bildirim gönderme yetkiniz yok." });
    }

    try {
        // Fetch order with all necessary relations
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                supplier: true,
                company: true,
                status: true,
                currency: true,
                items: true,
            },
        });

        if (!order) return jsonError(404, "not_found");

        const supplierEmail = (order as any)?.supplier?.email;
        if (!supplierEmail) {
            return jsonError(400, "no_supplier_email", { message: "Tedarikçinin e-posta adresi tanımlı değil." });
        }

        const supplierName = (order as any)?.supplier?.name || "Tedarikçi";
        const companyName = (order as any)?.company?.name || "";
        const orderTotal = typeof (order as any)?.realizedTotal?.toNumber === "function"
            ? (order as any).realizedTotal.toNumber()
            : Number((order as any)?.realizedTotal ?? 0);
        const currencyLabel = (order as any)?.currency?.label || "TRY";

        const subject = `Sipariş Bildirimi – ${order.barcode} – ${companyName}`;
        const fields = [
            { label: "Sipariş No", value: String(order.barcode || orderId) },
            ...(order.refNumber ? [{ label: "Referans No", value: order.refNumber }] : []),
            { label: "Alıcı Firma", value: companyName },
            { label: "Sipariş Durumu", value: String(order.status?.label || "") },
            { label: "Toplam Tutar", value: `${orderTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${currencyLabel}` },
            { label: "Bildirim Tarihi", value: new Date().toLocaleDateString("tr-TR") },
        ];

        const itemsList = order.items.map((it: any) => ({
            name: it.name,
            quantity: typeof it.quantity?.toNumber === "function" ? it.quantity.toNumber() : Number(it.quantity),
            unitPrice: typeof it.unitPrice?.toNumber === "function" ? it.unitPrice.toNumber() : Number(it.unitPrice),
        }));

        const html = renderEmailTemplate("detail", {
            title: "Sipariş Bildirimi",
            intro: `Sayın ${supplierName}, siparişiniz hakkında bilgilendirme. Aşağıda sipariş detaylarını bulabilirsiniz.`,
            fields,
            items: itemsList,
            actionUrl: "",
            actionText: ""
        });

        await dispatchEmail({ to: supplierEmail, subject, html, category: "supplier_order_notification" });

        console.log(`[Manual Supplier Notification] Email sent to ${supplierEmail} for order ${order.barcode} by user ${user.id}`);

        return NextResponse.json({
            ok: true,
            message: `Bildirim ${supplierEmail} adresine gönderildi`,
            notifiedAt: new Date().toISOString(),
            supplierEmail
        });

    } catch (e: any) {
        console.error("[Manual Supplier Notification] Error:", e);
        return jsonError(500, "notification_failed", { message: e?.message });
    }
}
