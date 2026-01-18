import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { requirePermissionApi } from "@/lib/apiAuth";

/**
 * POST /api/rfq/[id]/approve
 * RFQ'yu onay sürecine sokar veya doğrudan onaylar.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await requirePermissionApi(req, "rfq:approve");
        if (!user) return jsonError(403, "forbidden", { message: "RFQ onaylama yetkiniz yok." });

        const id = params.id;
        const rfq = await prisma.rfq.findUnique({
            where: { id },
            include: {
                items: true,
                requests: {
                    include: { request: true }
                }
            }
        });

        if (!rfq) return jsonError(404, "not_found", { message: "RFQ bulunamadı." });
        if (rfq.status === "APPROVED" || rfq.status === "ORDERED") {
            return jsonError(400, "invalid_state", { message: "RFQ zaten onaylanmış veya siparişe dönüştürülmüş." });
        }

        // 1. Onay Akışı Var mı?
        const workflow = await prisma.approvalWorkflow.findFirst({
            where: {
                entityType: "RFQ",
                active: true
            },
            include: {
                steps: {
                    orderBy: { stepOrder: "asc" }
                }
            }
        });

        if (workflow && workflow.steps.length > 0) {
            // Akış varsa: İlk adımı oluştur
            const firstStep = workflow.steps[0];

            await prisma.$transaction([
                // RFQ durumunu BEKLEMEDE yap
                prisma.rfq.update({
                    where: { id },
                    data: { status: "WAITING_APPROVAL" }
                }),
                // Onay kaydını oluştur
                prisma.approvalRecord.create({
                    data: {
                        entityType: "RFQ",
                        entityId: id,
                        stepOrder: firstStep.stepOrder,
                        stepName: firstStep.name,
                        status: "PENDING",
                        comment: "RFQ onay süreci başlatıldı."
                    }
                })
            ]);

            return NextResponse.json({
                ok: true,
                message: "Onay süreci başlatıldı.",
                status: "WAITING_APPROVAL",
                step: firstStep.name
            });
        } else {
            // Akış yoksa: Doğrudan onayla
            await prisma.rfq.update({
                where: { id },
                data: { status: "APPROVED" }
            });

            return NextResponse.json({
                ok: true,
                message: "RFQ doğrudan onaylandı.",
                status: "APPROVED"
            });
        }

    } catch (e: any) {
        console.error("[RFQ Approve] Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}
