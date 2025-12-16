import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthApi, getUserWithPermissions } from "@/lib/apiAuth";
import { notifyAndPublish } from "@/lib/notification-service";
import { logRequestRevision } from "@/lib/revision";

// Talep Onay/Ret API endpoint'i - DİNAMİK WORKFLOW DESTEĞİ
// POST: Talebi onayla veya reddet
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireAuthApi(req);
        if (!auth) {
            return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { action, comment } = body; // action: "approve" | "reject"

        if (!action || !["approve", "reject"].includes(action)) {
            return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
        }

        // Kullanıcı bilgilerini al
        const user = await getUserWithPermissions(req);
        if (!user) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 401 });
        }

        const userRoleKey = user.roleRef?.key || user.role || "user";

        // Talebi bul
        const request = await prisma.request.findUnique({
            where: { id },
            include: {
                status: true,
                unit: true,
                owner: true,
                responsible: true
            }
        });

        if (!request) {
            return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
        }

        // DİNAMİK WORKFLOW - Veritabanından oku (Birim Bazlı Öncelik)
        let workflow = null;
        if (request.unitId) {
            workflow = await prisma.approvalWorkflow.findFirst({
                where: {
                    entityType: "Request",
                    active: true,
                    unitId: request.unitId
                },
                include: {
                    steps: {
                        orderBy: { stepOrder: "asc" },
                        include: { approvers: true }
                    }
                }
            });
        }

        if (!workflow) {
            workflow = await prisma.approvalWorkflow.findFirst({
                where: {
                    entityType: "Request",
                    active: true,
                    unitId: null
                },
                include: {
                    steps: {
                        orderBy: { stepOrder: "asc" },
                        include: { approvers: true }
                    }
                }
            });
        }


    if (!workflow || workflow.steps.length === 0) {
        return NextResponse.json({ error: "Onay akışı bulunamadı" }, { status: 404 });
    }

    // Bu talep için mevcut onay kayıtlarını al
    const existingRecords = await prisma.approvalRecord.findMany({
        where: {
            entityType: "Request",
            entityId: id
        },
        orderBy: { stepOrder: "asc" }
    });

    // Mevcut tamamlanmış son adımı belirle (Parallel Support)
    let lastApprovedStep = 0;
    for (const step of workflow.steps) {
        const stepRecords = existingRecords.filter(r => r.stepOrder === step.stepOrder && r.status === "approved");
        const required = step.minApprovals || 1; // Default 1
        if (stepRecords.length >= required) {
            lastApprovedStep = step.stepOrder;
        } else {
            break; // Bu adım tamamlanmamış
        }
    }

    // Sıradaki adımı belirle
    let currentStepOrder = lastApprovedStep + 1;
    // Eğer reject edilmişse ve tekrar onaya sunuluyorsa? (Currently assumes linear forward)
    // Eğer mevcut adımda (tamamlanmamış) reject varsa?
    const currentStepRejected = existingRecords.some(r => r.stepOrder === currentStepOrder && r.status === "rejected");
    if (currentStepRejected && action === "approve") {
        // Reject edilmiş adımı tekrar onaylamaya çalışıyor?
        // Bu durumda stepOrder yine aynıdır.
    }

    const currentStep = workflow.steps.find(s => s.stepOrder === currentStepOrder);

    if (!currentStep) {
        return NextResponse.json({ error: "Tüm onay adımları tamamlanmış" }, { status: 400 });
    }

    // Kullanıcı daha önce bu adımı onaylamış mı?
    const alreadyApproved = existingRecords.some(r => r.stepOrder === currentStepOrder && r.approverId === auth.userId && r.status === "approved");
    if (alreadyApproved && action === "approve") {
        return NextResponse.json({ error: "Bu adımı zaten onayladınız" }, { status: 400 });
    }

    // Kullanıcı bu adımı onaylayabilir mi?
    const allowedRoles = [
        currentStep.approverRole,
        ...(currentStep.approvers || []).map(a => a.roleKey)
    ].filter(Boolean);

    const canApprove =
        userRoleKey === "admin" ||
        allowedRoles.includes(userRoleKey);

    if (!canApprove) {
        return NextResponse.json(
            { error: `Bu işlem için yetkiniz yok` },
            { status: 403 }
        );
    }

    // Sonraki durumu belirle
    let nextStatusLabel: string;
    let isStepCompleted = false;

    if (action === "reject") {
        nextStatusLabel = "Reddedildi";
    } else {
        // Onay durumunda: Yeterli sayıya ulaşıldı mı?
        const currentApprovals = existingRecords.filter(r => r.stepOrder === currentStepOrder && r.status === "approved").length;
        const required = currentStep.minApprovals || 1;

        if (currentApprovals + 1 >= required) {
            isStepCompleted = true;
            // Bir sonraki adım var mı?
            const nextStep = workflow.steps.find(s => s.stepOrder === currentStepOrder + 1);

            if (nextStep) {
                // Sonraki adım için bekleme durumu
                nextStatusLabel = `${nextStep.name} Bekliyor`;
            } else {
                // Son adım - tamamlandı
                nextStatusLabel = "Satınalma Havuzunda";
            }
        } else {
            // Adım henüz tamamlanmadı, beklemede kal
            // Current status preserved
            // Maybe update status to indicate progress? E.g. "Birim Onayı (1/2)"
            // For now, keep current status or generic "Birim Onayı Bekliyor"
            isStepCompleted = false;
            nextStatusLabel = request.status?.label || ""; // Keep current
        }
    }

    // Yeni durumu bul veya mevcut durumu koru
    let nextStatus = request.status; // Default keep current
    if (isStepCompleted || action === "reject") {
        const statusObj = await prisma.optionItem.findFirst({
            where: { label: { contains: nextStatusLabel!.split(" ")[0], mode: "insensitive" } }
        });
        if (statusObj) nextStatus = statusObj;
    }

    // ApprovalRecord oluştur
    await prisma.approvalRecord.create({
        data: {
            entityType: "Request",
            entityId: id,
            stepOrder: currentStepOrder,
            stepName: currentStep.name,
            status: action === "approve" ? "approved" : "rejected",
            approverId: String(auth.userId),
            comment: comment || null
        }
    });

    // Talebi güncelle (including SLA tracking)
    const updatedRequest = await prisma.request.update({
        where: { id },
        data: {
            statusId: nextStatus?.id || request.statusId,
            lastApprovalAt: new Date() // SLA tracking
        },
        include: {
            status: true,
            owner: true,
            responsible: true,
            unit: true
        }
    });

    // Revision Logging
    await logRequestRevision({
        requestId: id,
        userId: String(auth.userId),
        action: action === "approve" ? "approve" : "reject",
        fieldName: "Durum",
        oldValue: request.status?.label,
        newValue: nextStatus?.label,
        comment: comment || undefined
    });

    // Bildirimleri gönder
    const actionText = action === "approve" ? "onaylandı" : "reddedildi";
    const notifyUserIds = [request.ownerUserId, request.responsibleUserId].filter(Boolean) as string[];

    for (const userId of notifyUserIds) {
        await notifyAndPublish({
            userId,
            title: `Talep ${actionText}`,
            body: `${request.barcode} - ${request.subject} talebi ${currentStep.name} adımında ${actionText}.`,
            type: action === "approve" ? "success" : "error",
            link: `/talep/detay/${id}`
        });
    }

    // Yorum ekle
    await prisma.comment.create({
        data: {
            requestId: id,
            authorId: String(auth.userId),
            text: `[${action === "approve" ? "ONAY" : "RET"}] ${currentStep.name}: ${user.username || "Kullanıcı"} tarafından ${actionText}. ${comment ? `Not: ${comment}` : ""}`
        }
    });

    return NextResponse.json({
        message: `Talep başarıyla ${actionText}`,
        request: updatedRequest,
        currentStep: currentStep.name,
        nextStep: action === "approve"
            ? workflow.steps.find(s => s.stepOrder === currentStepOrder + 1)?.name || "Tamamlandı"
            : null
    });

} catch (error) {
    console.error("[Request Approve] Error:", error);
    return NextResponse.json({ error: "İşlem başarısız" }, { status: 500 });
}
}

// GET: Onay geçmişini ve workflow durumunu getir
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireAuthApi(req);
        if (!auth) {
            return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
        }

        const { id } = await params;

        // Onay geçmişini getir
        const approvalHistory = await prisma.approvalRecord.findMany({
            where: {
                entityType: "Request",
                entityId: id
            },
            include: {
                approver: {
                    select: { id: true, username: true, email: true }
                }
            },
            orderBy: { createdAt: "asc" }
        });

        // Workflow'u getir
        // Mevcut durumu getir
        const request = await prisma.request.findUnique({
            where: { id },
            include: { status: true }
        });

        // Workflow'u getir (Birim Bazlı)
        let workflow = null;
        if (request?.unitId) {
            workflow = await prisma.approvalWorkflow.findFirst({
                where: {
                    entityType: "Request",
                    active: true,
                    unitId: request.unitId
                },
                include: { steps: { orderBy: { stepOrder: "asc" }, include: { approvers: true } } }
            });
        }

        if (!workflow) {
            workflow = await prisma.approvalWorkflow.findFirst({
                where: {
                    entityType: "Request",
                    active: true,
                    unitId: null
                },
                include: { steps: { orderBy: { stepOrder: "asc" }, include: { approvers: true } } }
            });
        }

        // Tamamlanan ve bekleyen adımları belirle (Parallel Aware)
        let lastApprovedStep = 0;
        if (workflow) {
            for (const step of workflow.steps) {
                const stepRecords = approvalHistory.filter(h => h.stepOrder === step.stepOrder && h.status === "approved");
                const required = step.minApprovals || 1;
                if (stepRecords.length >= required) {
                    lastApprovedStep = step.stepOrder;
                } else {
                    break;
                }
            }
        }

        const rejectedStep = approvalHistory.find(h => h.status === "rejected");
        const currentStepOrder = lastApprovedStep + 1;

        const stepsWithStatus = workflow?.steps.map(step => {
            const stepRecords = approvalHistory.filter(h => h.stepOrder === step.stepOrder && h.status === "approved");
            const approvedCount = stepRecords.length;
            const requiredCount = step.minApprovals || 1;

            let status = "pending";
            if (rejectedStep && rejectedStep.stepOrder === step.stepOrder) {
                status = "rejected";
            } else if (step.stepOrder <= lastApprovedStep) {
                status = "completed";
            } else if (step.stepOrder === currentStepOrder) {
                status = "current";
            }

            return {
                ...step,
                status,
                approvedCount,
                requiredCount,
                approvers: step.approvers // Include approvers list
            };
        }) || [];

        return NextResponse.json({
            history: approvalHistory,
            currentStatus: request?.status?.label,
            workflow: workflow ? {
                id: workflow.id,
                name: workflow.name,
                displayName: workflow.displayName,
                steps: stepsWithStatus
            } : null
        });

    } catch (error) {
        console.error("[Request Approve GET] Error:", error);
        return NextResponse.json({ error: "Geçmiş alınamadı" }, { status: 500 });
    }
}
