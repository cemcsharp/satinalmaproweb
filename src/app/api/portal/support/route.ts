import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthApi } from "@/lib/apiAuth";
import { jsonError } from "@/lib/apiError";

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuthApi(req);
        if (!auth) return jsonError(401, "unauthorized");

        // Fetch user and their supplier relation
        const user = await prisma.user.findUnique({
            where: { id: auth.userId },
            select: { supplierId: true }
        });

        if (!user?.supplierId) {
            return jsonError(403, "supplier_access_denied", { message: "Bu hesap bir tedarikçi ile iliştirilmemiş." });
        }

        // Fetch tickets for this supplier
        const tickets = await prisma.supportTicket.findMany({
            where: { supplierId: user.supplierId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                subject: true,
                message: true,
                status: true,
                priority: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return NextResponse.json({ tickets, total: tickets.length });
    } catch (e: unknown) {
        console.error("[Portal Support API Error]", e);
        const message = e instanceof Error ? e.message : "Unknown error";
        return jsonError(500, "server_error", { message });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuthApi(req);
        if (!auth) return jsonError(401, "unauthorized");

        // Fetch user and their supplier relation
        const user = await prisma.user.findUnique({
            where: { id: auth.userId },
            select: { supplierId: true }
        });

        if (!user?.supplierId) {
            return jsonError(403, "supplier_access_denied", { message: "Bu hesap bir tedarikçi ile iliştirilmemiş." });
        }

        const body = await req.json();
        const { subject, message, priority } = body;

        if (!subject || !message) {
            return jsonError(400, "missing_fields", { message: "Konu ve mesaj alanları zorunludur." });
        }

        // Create new ticket
        const ticket = await prisma.supportTicket.create({
            data: {
                supplierId: user.supplierId,
                subject: subject.substring(0, 200),
                message: message.substring(0, 2000),
                priority: priority || "NORMAL",
                status: "OPEN"
            },
            select: {
                id: true,
                subject: true,
                status: true,
                priority: true,
                createdAt: true
            }
        });

        return NextResponse.json({ success: true, ticket });
    } catch (e: unknown) {
        console.error("[Portal Support Create Error]", e);
        const message = e instanceof Error ? e.message : "Unknown error";
        return jsonError(500, "server_error", { message });
    }
}
