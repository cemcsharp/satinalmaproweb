import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionApi } from "@/lib/apiAuth";
import { jsonError } from "@/lib/apiError";

// GET - Get specific workflow
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    try {
        const user = await requirePermissionApi(req, "ayarlar:read");
        if (!user) return jsonError(403, "forbidden");

        const workflow = await prisma.approvalWorkflow.findUnique({
            where: { id },
            include: {
                steps: {
                    orderBy: { stepOrder: "asc" },
                },
            },
        });

        if (!workflow) {
            return jsonError(404, "not_found", { message: "İş akışı bulunamadı" });
        }

        return NextResponse.json({ workflow });
    } catch (e: any) {
        console.error("[Workflow API] GET Error:", e);
        return jsonError(500, "server_error", { message: e?.message });
    }
}

// PUT - Update workflow
export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    try {
        const user = await requirePermissionApi(req, "ayarlar:write");
        if (!user) return jsonError(403, "forbidden");

        const body = await req.json();
        const { displayName, active, steps } = body;

        // Update workflow
        const workflow = await prisma.approvalWorkflow.update({
            where: { id },
            data: {
                displayName: displayName || undefined,
                active: typeof active === "boolean" ? active : undefined,
            },
        });

        // Update steps if provided
        if (steps && Array.isArray(steps)) {
            // Delete existing steps
            await prisma.approvalStep.deleteMany({ where: { workflowId: id } });

            // Create new steps
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
                    budgetLimit: step.budgetLimit ? parseFloat(step.budgetLimit) : null,
                })),
            });
        }

        // Fetch updated workflow with steps
        const updated = await prisma.approvalWorkflow.findUnique({
            where: { id },
            include: {
                steps: {
                    orderBy: { stepOrder: "asc" },
                },
            },
        });

        return NextResponse.json({ ok: true, workflow: updated });
    } catch (e: any) {
        console.error("[Workflow API] PUT Error:", e);
        return jsonError(500, "server_error", { message: e?.message });
    }
}

// DELETE - Delete workflow
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    try {
        const user = await requirePermissionApi(req, "ayarlar:delete");
        if (!user) return jsonError(403, "forbidden");

        await prisma.approvalWorkflow.delete({ where: { id } });

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        console.error("[Workflow API] DELETE Error:", e);
        return jsonError(500, "server_error", { message: e?.message });
    }
}
