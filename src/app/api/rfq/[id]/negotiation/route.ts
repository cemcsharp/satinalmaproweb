import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { getSessionUser } from "@/lib/apiAuth";
import { dispatchEmail, renderEmailTemplate } from "@/lib/mailer";

/**
 * Pazarlık Turunu Başlat
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getSessionUser(req);
        if (!user) return jsonError(401, "unauthorized");

        const { id } = await params;
        const body = await req.json();
        const { deadline, status = "ACTIVE" } = body;

        // RFQ'yu bul ve yetki kontrolü
        const rfq = await prisma.rfq.findUnique({
            where: { id },
            select: { tenantId: true, negotiationRound: true }
        });

        if (!rfq) return jsonError(404, "rfq_not_found");
        if (!user.isSuperAdmin && rfq.tenantId !== user.tenantId) {
            return jsonError(403, "tenant_mismatch");
        }

        // Pazarlık Turunu Güncelle
        const updatedRfq = await prisma.rfq.update({
            where: { id },
            data: {
                negotiationStatus: status,
                negotiationRound: { increment: 1 },
                negotiationDeadline: deadline ? new Date(deadline) : null,
                // Eğer RFQ süresi dolmuşsa, yeni deadline ile uzatılabilir
                deadline: deadline ? new Date(deadline) : undefined
            }
        });

        // Tedarikçilere bildirim/mail gönderimi
        try {
            const suppliers = await prisma.rfqSupplier.findMany({
                where: { rfqId: id },
                select: { email: true, companyName: true, token: true }
            });

            const portalUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

            for (const s of suppliers) {
                if (!s.email) continue;

                const emailHtml = renderEmailTemplate("generic", {
                    title: "Yeni Pazarlık Turu Başladı",
                    body: `Sayın ${s.companyName || 'Yetkili'},<br><br>
                          <b>${updatedRfq.title}</b> konulu talep için yeni bir pazarlık turu başlatılmıştır. 
                          Lütfen belirlenen son tarihe kadar teklifinizi güncelleyiniz.<br><br>
                          <b>Son Tarih:</b> ${deadline ? new Date(deadline).toLocaleString("tr-TR") : "Belirtilmedi"}`,
                    actionUrl: `${portalUrl}/portal/rfq/${s.token}`,
                    actionText: "Teklifi Güncelle / Canlı Pazarlık"
                });

                await dispatchEmail({
                    to: s.email,
                    subject: `Yeni Pazarlık Turu: ${updatedRfq.title}`,
                    html: emailHtml,
                    category: "negotiation"
                });
            }
        } catch (mailError) {
            console.error("[NEGOTIATION_MAIL_ERROR]", mailError);
        }

        return NextResponse.json({
            ok: true,
            round: updatedRfq.negotiationRound,
            status: updatedRfq.negotiationStatus
        });

    } catch (error) {
        console.error("[RFQ_NEGOTIATION_POST]", error);
        return jsonError(500, "server_error");
    }
}

/**
 * Pazarlığı Bitir / Durdur
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getSessionUser(req);
        if (!user) return jsonError(401, "unauthorized");

        const { id } = await params;

        const rfq = await prisma.rfq.findUnique({
            where: { id },
            select: { tenantId: true }
        });

        if (!rfq) return jsonError(404, "rfq_not_found");
        if (!user.isSuperAdmin && rfq.tenantId !== user.tenantId) {
            return jsonError(403, "tenant_mismatch");
        }

        await prisma.rfq.update({
            where: { id },
            data: {
                negotiationStatus: "FINISHED"
            }
        });

        return NextResponse.json({ ok: true, status: "FINISHED" });

    } catch (error) {
        console.error("[RFQ_NEGOTIATION_DELETE]", error);
        return jsonError(500, "server_error");
    }
}
