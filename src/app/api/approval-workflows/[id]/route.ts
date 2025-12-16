import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthApi } from "@/lib/apiAuth";

// Tekil Onay Akışı API
// GET: Akış detayını getir
// PUT: Akışı güncelle
// DELETE: Akışı sil
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

        const workflow = await prisma.approvalWorkflow.findUnique({
            where: { id },
            include: {
                steps: {
                    orderBy: { stepOrder: "asc" }
                }
            }
        });

        if (!workflow) {
            return NextResponse.json({ error: "Akış bulunamadı" }, { status: 404 });
        }

        return NextResponse.json(workflow);
    } catch (error) {
        console.error("[Approval Workflow GET] Error:", error);
        return NextResponse.json({ error: "Akış alınamadı" }, { status: 500 });
    }
}

export async function PUT(
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
        const { displayName, entityType, active, steps } = body;

        // Önce mevcut akışı bul
        const existing = await prisma.approvalWorkflow.findUnique({
            where: { id },
            include: { steps: true }
        });

        if (!existing) {
            return NextResponse.json({ error: "Akış bulunamadı" }, { status: 404 });
        }

        // Adımları güncelle (önce mevcut adımları sil, sonra yenilerini ekle)
        if (steps && Array.isArray(steps)) {
            await prisma.approvalStep.deleteMany({
                where: { workflowId: id }
            });

            await prisma.approvalStep.createMany({
                data: steps.map((step: any, index: number) => ({
                    workflowId: id,
                    stepOrder: index + 1,
                    name: step.name,
                    description: step.description || null,
                    approverRole: step.approverRole || null,
                    approverUnit: step.approverUnit || null,
                    required: step.required !== false,
                    autoApprove: step.autoApprove || false,
                    budgetLimit: step.budgetLimit ? parseFloat(step.budgetLimit) : null
                }))
            });
        }

        // Akışı güncelle
        const workflow = await prisma.approvalWorkflow.update({
            where: { id },
            data: {
                displayName: displayName || existing.displayName,
                entityType: entityType || existing.entityType,
                active: active !== undefined ? active : existing.active
            },
            include: { steps: { orderBy: { stepOrder: "asc" } } }
        });

        return NextResponse.json(workflow);
    } catch (error) {
        console.error("[Approval Workflow PUT] Error:", error);
        return NextResponse.json({ error: "Akış güncellenemedi" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireAuthApi(req);
        if (!auth) {
            return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
        }

        const { id } = await params;

        // Önce adımları sil
        await prisma.approvalStep.deleteMany({
            where: { workflowId: id }
        });

        // Sonra akışı sil
        await prisma.approvalWorkflow.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Akış silindi" });
    } catch (error) {
        console.error("[Approval Workflow DELETE] Error:", error);
        return NextResponse.json({ error: "Akış silinemedi" }, { status: 500 });
    }
}
