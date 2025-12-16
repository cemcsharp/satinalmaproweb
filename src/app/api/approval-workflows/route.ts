import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthApi } from "@/lib/apiAuth";

// Onay Akışları API
// GET: Tüm akışları listele
// POST: Yeni akış oluştur
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuthApi(req);
        if (!auth) {
            return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
        }

        const workflows = await prisma.approvalWorkflow.findMany({
            include: {
                steps: {
                    orderBy: { stepOrder: "asc" }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(workflows);
    } catch (error) {
        console.error("[Approval Workflows GET] Error:", error);
        return NextResponse.json({ error: "Akışlar alınamadı" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuthApi(req);
        if (!auth) {
            return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
        }

        const body = await req.json();
        const { name, displayName, entityType, steps } = body;

        if (!name || !displayName || !entityType) {
            return NextResponse.json({ error: "Gerekli alanlar eksik" }, { status: 400 });
        }

        // Check if workflow with same name exists
        const existing = await prisma.approvalWorkflow.findUnique({
            where: { name }
        });

        if (existing) {
            return NextResponse.json({ error: "Bu isimde bir akış zaten var" }, { status: 400 });
        }

        const workflow = await prisma.approvalWorkflow.create({
            data: {
                name,
                displayName,
                entityType,
                active: true,
                steps: steps ? {
                    create: steps.map((step: any, index: number) => ({
                        stepOrder: index + 1,
                        name: step.name,
                        description: step.description || null,
                        approverRole: step.approverRole,
                        approverUnit: step.approverUnit || null,
                        required: step.required !== false,
                        autoApprove: step.autoApprove || false,
                        budgetLimit: step.budgetLimit ? parseFloat(step.budgetLimit) : null
                    }))
                } : undefined
            },
            include: { steps: { orderBy: { stepOrder: "asc" } } }
        });

        return NextResponse.json(workflow, { status: 201 });
    } catch (error) {
        console.error("[Approval Workflows POST] Error:", error);
        return NextResponse.json({ error: "Akış oluşturulamadı" }, { status: 500 });
    }
}
