import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { notify } from "@/lib/notification-service";
import { dispatchEmail, renderEmailTemplate } from "@/lib/mailer";

// Get approval status for an entity
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ entityType: string; entityId: string }> }
) {
    try {
        const { entityType, entityId } = await context.params;

        // Get entity details
        let entity: any = null;
        if (entityType === "Request") {
            entity = await prisma.request.findUnique({
                where: { id: entityId },
                include: { status: true, unit: true, owner: true }
            });
        } else if (entityType === "Order") {
            entity = await prisma.order.findUnique({
                where: { id: entityId },
                include: { status: true, supplier: true }
            });
        }

        if (!entity) {
            return NextResponse.json({ error: "Entity not found" }, { status: 404 });
        }

        // Get workflow for this entity type
        const workflow = await prisma.approvalWorkflow.findFirst({
            where: { entityType, active: true },
            include: { steps: { orderBy: { stepOrder: "asc" } } }
        });

        if (!workflow) {
            return NextResponse.json({
                hasWorkflow: false,
                message: "No workflow defined for this entity type"
            });
        }

        // Get approval records
        const records = await prisma.approvalRecord.findMany({
            where: { entityType, entityId },
            include: { approver: { select: { id: true, username: true, email: true } } },
            orderBy: { stepOrder: "asc" }
        });

        // Build status for each step
        const stepsStatus = workflow.steps.map(step => {
            const record = records.find(r => r.stepOrder === step.stepOrder);
            return {
                stepOrder: step.stepOrder,
                name: step.name,
                description: step.description,
                approverRole: step.approverRole,
                required: step.required,
                status: record?.status || "pending",
                approver: record?.approver || null,
                comment: record?.comment || null,
                processedAt: record?.processedAt || null
            };
        });

        // Find current pending step
        const currentStep = stepsStatus.find(s => s.status === "pending" && s.required);

        // Overall status
        const allApproved = stepsStatus.filter(s => s.required).every(s => s.status === "approved");
        const anyRejected = stepsStatus.some(s => s.status === "rejected");
        const overallStatus = anyRejected ? "rejected" : allApproved ? "approved" : "pending";

        return NextResponse.json({
            hasWorkflow: true,
            entityId,
            entityType,
            workflow: {
                id: workflow.id,
                name: workflow.name,
                displayName: workflow.displayName
            },
            steps: stepsStatus,
            currentStep: currentStep || null,
            overallStatus,
            canApprove: !!currentStep
        });
    } catch (e: any) {
        console.error("Approval status error:", e);
        return NextResponse.json({ error: e?.message || "unknown" }, { status: 500 });
    }
}

// Process approval (approve or reject)
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ entityType: string; entityId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { entityType, entityId } = await context.params;
        const body = await req.json();
        const { action, comment, stepOrder } = body; // action: "approve" | "reject"

        if (!action || !["approve", "reject"].includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        // Get workflow
        const workflow = await prisma.approvalWorkflow.findFirst({
            where: { entityType, active: true },
            include: { steps: { orderBy: { stepOrder: "asc" } } }
        });

        if (!workflow) {
            return NextResponse.json({ error: "No workflow for this entity type" }, { status: 400 });
        }

        // Get existing records
        const existingRecords = await prisma.approvalRecord.findMany({
            where: { entityType, entityId },
            orderBy: { stepOrder: "asc" }
        });

        // Determine which step to process
        const targetStepOrder = stepOrder || (existingRecords.length > 0
            ? Math.max(...existingRecords.filter(r => r.status === "approved").map(r => r.stepOrder)) + 1
            : 1);

        const step = workflow.steps.find(s => s.stepOrder === targetStepOrder);
        if (!step) {
            return NextResponse.json({ error: "Invalid step" }, { status: 400 });
        }

        // Check if user has permission to approve this step
        // TODO: Add role-based permission check based on step.approverRole
        const userId = (session.user as any).id;

        // Create or update approval record
        const existingRecord = existingRecords.find(r => r.stepOrder === targetStepOrder);

        let record;
        if (existingRecord) {
            record = await prisma.approvalRecord.update({
                where: { id: existingRecord.id },
                data: {
                    status: action === "approve" ? "approved" : "rejected",
                    approverId: userId,
                    comment,
                    processedAt: new Date()
                }
            });
        } else {
            record = await prisma.approvalRecord.create({
                data: {
                    entityType,
                    entityId,
                    stepOrder: step.stepOrder,
                    stepName: step.name,
                    status: action === "approve" ? "approved" : "rejected",
                    approverId: userId,
                    comment,
                    processedAt: new Date()
                }
            });
        }

        // Update entity status if all steps approved or if rejected
        const allRecords = await prisma.approvalRecord.findMany({
            where: { entityType, entityId }
        });

        const requiredSteps = workflow.steps.filter(s => s.required);
        const allApproved = requiredSteps.every(s =>
            allRecords.some(r => r.stepOrder === s.stepOrder && r.status === "approved")
        );
        const anyRejected = allRecords.some(r => r.status === "rejected");

        // Update entity status
        if (entityType === "Request") {
            if (anyRejected) {
                // Find "Reddedildi" status
                const rejectedStatus = await prisma.optionItem.findFirst({
                    where: { category: { key: "durum" }, label: { contains: "Reddedil" } }
                });
                if (rejectedStatus) {
                    await prisma.request.update({
                        where: { id: entityId },
                        data: { statusId: rejectedStatus.id }
                    });
                }
            } else if (allApproved) {
                // Find "Onaylandı" status
                const approvedStatus = await prisma.optionItem.findFirst({
                    where: { category: { key: "durum" }, label: { contains: "Onayl" } }
                });
                if (approvedStatus) {
                    await prisma.request.update({
                        where: { id: entityId },
                        data: { statusId: approvedStatus.id }
                    });
                }
            }
        }

        // Send notifications
        try {
            const entity = entityType === "Request"
                ? await prisma.request.findUnique({ where: { id: entityId }, include: { owner: true } })
                : await prisma.order.findUnique({ where: { id: entityId }, include: { responsible: true } });

            const targetUserId = (entity as any)?.owner?.id || (entity as any)?.responsible?.id;
            if (targetUserId) {
                const statusText = action === "approve" ? "onaylandı" : "reddedildi";
                await notify({
                    userId: targetUserId,
                    title: `${step.name} ${statusText}`,
                    body: `${entityType === "Request" ? "Talep" : "Sipariş"} ${(entity as any)?.barcode || entityId} adım ${step.stepOrder} ${statusText}.`
                });
            }
        } catch { }

        return NextResponse.json({
            ok: true,
            record,
            overallStatus: anyRejected ? "rejected" : allApproved ? "approved" : "pending"
        });
    } catch (e: any) {
        console.error("Approval process error:", e);
        return NextResponse.json({ error: e?.message || "unknown" }, { status: 500 });
    }
}
