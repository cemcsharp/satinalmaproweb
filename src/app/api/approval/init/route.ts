import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Initialize default approval workflows
 * Call this endpoint once to set up the default workflows
 * GET /api/approval/init
 */
export async function GET() {
    try {
        // Check if workflows already exist
        const existing = await prisma.approvalWorkflow.count();
        if (existing > 0) {
            return NextResponse.json({
                ok: true,
                message: "Workflows already initialized",
                count: existing
            });
        }

        // Create Request Approval Workflow
        const requestWorkflow = await prisma.approvalWorkflow.create({
            data: {
                name: "request_approval",
                displayName: "Talep Onay Akışı",
                entityType: "Request",
                active: true,
                steps: {
                    create: [
                        {
                            stepOrder: 1,
                            name: "Birim Yöneticisi Onayı",
                            description: "Talep eden birimin yöneticisi onayı",
                            approverRole: "unit_manager",
                            required: true,
                            autoApprove: false
                        },
                        {
                            stepOrder: 2,
                            name: "Satınalma Onayı",
                            description: "Satınalma birimi değerlendirmesi ve onayı",
                            approverRole: "purchasing",
                            required: true,
                            autoApprove: false
                        }
                    ]
                }
            },
            include: { steps: true }
        });

        // Create Order Approval Workflow
        const orderWorkflow = await prisma.approvalWorkflow.create({
            data: {
                name: "order_approval",
                displayName: "Sipariş Onay Akışı",
                entityType: "Order",
                active: true,
                steps: {
                    create: [
                        {
                            stepOrder: 1,
                            name: "Satınalma Onayı",
                            description: "Satınalma müdürü onayı",
                            approverRole: "purchasing",
                            required: true,
                            autoApprove: false
                        },
                        {
                            stepOrder: 2,
                            name: "Finans Onayı",
                            description: "Finans birimi bütçe kontrolü ve onayı",
                            approverRole: "finance",
                            required: true,
                            autoApprove: false
                        }
                    ]
                }
            },
            include: { steps: true }
        });

        return NextResponse.json({
            ok: true,
            message: "Default workflows created",
            workflows: [requestWorkflow, orderWorkflow]
        });
    } catch (e: any) {
        console.error("Workflow init error:", e);
        return NextResponse.json({ error: e?.message || "unknown" }, { status: 500 });
    }
}
