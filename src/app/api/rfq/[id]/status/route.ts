import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { requirePermissionApi } from "@/lib/apiAuth";
import { dispatchEmail, renderEmailTemplate } from "@/lib/mailer";

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    let id = "";
    try {
        const p = await context.params;
        id = p.id;
        const user = await requirePermissionApi(req, "rfq:edit");
        if (!user) return jsonError(403, "forbidden");

        const body = await req.json();
        const { status, reason } = body;

        if (!["ACTIVE", "PASSIVE", "CANCELLED"].includes(status)) {
            return jsonError(400, "invalid_status");
        }

        // 1. Update RFQ Status
        const rfq = await prisma.rfq.update({
            where: { id },
            data: { status },
            include: {
                suppliers: {
                    select: { email: true, contactName: true, companyName: true, token: true }
                }
            }
        });

        // 2. If status is PASSIVE or CANCELLED, notify suppliers
        if (status === "PASSIVE" || status === "CANCELLED") {
            const statusLabel = status === "PASSIVE" ? "DURDURULDU (PASİF)" : "İPTAL EDİLDİ";
            const subject = `BİLGİLENDİRME: Teklif İsteği Durumu Değişti - ${rfq.rfxCode}`;

            // Background dispatch to avoid blocking the response
            (async () => {
                for (const s of rfq.suppliers) {
                    try {
                        const html = renderEmailTemplate("generic", {
                            title: `Teklif İsteği ${statusLabel}`,
                            body: `
                                <p>Sayın ${s.contactName || s.companyName || "Yetkili"},</p>
                                <p><strong>${rfq.rfxCode}</strong> kodlu ve <strong>"${rfq.title}"</strong> konulu teklif toplama süreci sistem yöneticisi tarafından <strong>${statusLabel}</strong> konumuna getirilmiştir.</p>
                                ${reason ? `<p><strong>Gerekçe:</strong> ${reason}</p>` : ""}
                                <p>Bu aşamadan sonra söz konusu talep için yeni teklif girişi kabul edilmeyecektir.</p>
                                <p>İlginiz için teşekkür ederiz.</p>
                            `,
                            actionText: "Sisteme Git",
                            actionUrl: `${req.nextUrl.origin}/portal/rfq/${s.token}`
                        });

                        await dispatchEmail({
                            to: s.email,
                            subject,
                            html,
                            category: "rfq_status_change"
                        });
                    } catch (e) {
                        console.error(`Status notification failed for ${s.email}`, e);
                    }
                }
            })();
        }

        return NextResponse.json({ ok: true, status: rfq.status });

    } catch (e: any) {
        console.error("RFQ Status Update Error:", e);
        return jsonError(500, "server_error", { message: e.message || String(e) });
    }
}
