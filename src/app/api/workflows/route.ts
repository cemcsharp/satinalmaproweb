import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionApi } from "@/lib/apiAuth";
import { jsonError } from "@/lib/apiError";

// GET - List all workflows with steps
export async function GET(req: NextRequest) {
    try {
        const user = await requirePermissionApi(req, "ayarlar:read");
        if (!user) return jsonError(403, "forbidden");

        const workflows = await prisma.approvalWorkflow.findMany({
            orderBy: { createdAt: "asc" },
            include: {
                steps: {
                    orderBy: { stepOrder: "asc" },
                },
            },
        });

        return NextResponse.json({ workflows });
    } catch (e: any) {
        console.error("[Workflows API] GET Error:", e);
        return jsonError(500, "server_error", { message: e?.message });
    }
}

// POST - Create new workflow
export async function POST(req: NextRequest) {
    try {
        const user = await requirePermissionApi(req, "ayarlar:write");
        if (!user) return jsonError(403, "forbidden");

        const body = await req.json();
        const { name, displayName, entityType, steps } = body;

        if (!name || !displayName || !entityType) {
            return jsonError(400, "missing_fields", { message: "name, displayName, entityType zorunlu" });
        }

        // Check for duplicate name
        const existing = await prisma.approvalWorkflow.findUnique({ where: { name } });
        if (existing) {
            return jsonError(409, "duplicate", { message: "Bu isimde bir iş akışı zaten var" });
        }

        const workflow = await prisma.approvalWorkflow.create({
            data: {
                name,
                displayName,
                entityType,
                active: true,
                steps: steps && Array.isArray(steps) && steps.length > 0 ? {
                    create: steps.map((step: any, index: number) => ({
                        stepOrder: index + 1,
                        name: step.name,
                        description: step.description || null,
                        approverRole: step.approverRole || null,
                        approverUnit: step.approverUnit || null,
                        required: step.required !== false,
                        autoApprove: step.autoApprove || false,
                        budgetLimit: step.budgetLimit ? parseFloat(step.budgetLimit) : null,
                    })),
                } : undefined,
            },
            include: {
                steps: {
                    orderBy: { stepOrder: "asc" },
                },
            },
        });

        return NextResponse.json({ ok: true, workflow }, { status: 201 });
    } catch (e: any) {
        console.error("[Workflows API] POST Error:", e);
        return jsonError(500, "server_error", { message: e?.message });
    }
}
