import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// Get all active workflows
export async function GET() {
    try {
        const workflows = await prisma.approvalWorkflow.findMany({
            where: { active: true },
            include: {
                steps: {
                    orderBy: { stepOrder: "asc" }
                }
            },
            orderBy: { name: "asc" }
        });

        return NextResponse.json({ workflows });
    } catch (e: any) {
        console.error("Approval workflows fetch error:", e);
        return NextResponse.json({ error: e?.message || "unknown" }, { status: 500 });
    }
}

// Create new workflow (admin only)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;
        if (!session?.user || userRole !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, displayName, entityType, steps } = body;

        if (!name || !displayName || !entityType) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const workflow = await prisma.approvalWorkflow.create({
            data: {
                name,
                displayName,
                entityType,
                steps: steps?.length ? {
                    create: steps.map((s: any, index: number) => ({
                        stepOrder: index + 1,
                        name: s.name,
                        description: s.description,
                        approverRole: s.approverRole,
                        approverUnit: s.approverUnit,
                        required: s.required ?? true,
                        autoApprove: s.autoApprove ?? false,
                        budgetLimit: s.budgetLimit
                    }))
                } : undefined
            },
            include: { steps: true }
        });

        return NextResponse.json({ workflow });
    } catch (e: any) {
        console.error("Approval workflow create error:", e);
        return NextResponse.json({ error: e?.message || "unknown" }, { status: 500 });
    }
}
