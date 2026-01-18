import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { requirePermissionApi } from "@/lib/apiAuth";

/**
 * GET /api/finans/sozlesmeler/[id]
 * Tek bir sözleşmenin detaylarını getirir.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requirePermissionApi(req, "sozlesme:read");
        if (!user) return jsonError(403, "forbidden");

        const { id } = await params;

        const contract = await prisma.contract.findUnique({
            where: { id },
            include: {
                responsible: { select: { username: true } },
                order: { select: { barcode: true } }
            }
        });

        if (!contract) {
            return jsonError(404, "not_found", { message: "Sözleşme bulunamadı." });
        }

        // Multi-tenant check
        if (!user.isSuperAdmin && contract.tenantId !== user.tenantId) {
            return jsonError(403, "forbidden");
        }

        return NextResponse.json(contract);

    } catch (e: any) {
        console.error("[Contract Detail] Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}

/**
 * PUT /api/finans/sozlesmeler/[id]
 * Sözleşmeyi günceller.
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requirePermissionApi(req, "sozlesme:manage");
        if (!user) return jsonError(403, "forbidden");

        const { id } = await params;
        const body = await req.json();

        const existing = await prisma.contract.findUnique({ where: { id } });
        if (!existing) {
            return jsonError(404, "not_found");
        }

        // Multi-tenant check
        if (!user.isSuperAdmin && existing.tenantId !== user.tenantId) {
            return jsonError(403, "forbidden");
        }

        const updated = await prisma.contract.update({
            where: { id },
            data: {
                title: body.title,
                parties: body.parties,
                startDate: body.startDate ? new Date(body.startDate) : undefined,
                endDate: body.endDate ? new Date(body.endDate) : null,
                type: body.type,
                status: body.status,
                responsibleUserId: body.responsibleUserId || null,
                notes: body.notes || null
            }
        });

        return NextResponse.json(updated);

    } catch (e: any) {
        console.error("[Contract Update] Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}

/**
 * DELETE /api/finans/sozlesmeler/[id]
 * Sözleşmeyi siler.
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requirePermissionApi(req, "sozlesme:manage");
        if (!user) return jsonError(403, "forbidden");

        const { id } = await params;

        const existing = await prisma.contract.findUnique({ where: { id } });
        if (!existing) {
            return jsonError(404, "not_found");
        }

        if (!user.isSuperAdmin && existing.tenantId !== user.tenantId) {
            return jsonError(403, "forbidden");
        }

        await prisma.contract.delete({ where: { id } });

        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error("[Contract Delete] Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}
