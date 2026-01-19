import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthApi } from "@/lib/apiAuth";
import { jsonError } from "@/lib/apiError";

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuthApi(req);
        if (!auth) return jsonError(401, "unauthorized");

        // Fetch user and their tenant relation
        const user = await prisma.user.findUnique({
            where: { id: auth.userId },
            select: { tenantId: true }
        });

        if (!user?.tenantId) {
            return jsonError(403, "supplier_access_denied", { message: "Bu hesap bir tedarikçi ile iliştirilmemiş." });
        }

        // Fetch supplier (tenant) profile
        const supplier = await prisma.tenant.findUnique({
            where: { id: user.tenantId, isSupplier: true },
            select: {
                id: true,
                name: true,
                taxId: true,
                taxOffice: true,
                address: true,
                contactName: true,
                email: true,
                phone: true,
                website: true,
                bankName: true,
                bankBranch: true,
                bankIban: true,
                bankAccountNo: true,
                bankCurrency: true,
                commercialRegistrationNo: true,
                mersisNo: true,
                notes: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!supplier) {
            return jsonError(404, "not_found", { message: "Tedarikçi profili bulunamadı." });
        }

        return NextResponse.json({ profile: supplier });
    } catch (e: unknown) {
        console.error("[Portal Profile API Error]", e);
        const message = e instanceof Error ? e.message : "Unknown error";
        return jsonError(500, "server_error", { message });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const auth = await requireAuthApi(req);
        if (!auth) return jsonError(401, "unauthorized");

        // Fetch user and their tenant relation
        const user = await prisma.user.findUnique({
            where: { id: auth.userId },
            select: { tenantId: true }
        });

        if (!user?.tenantId) {
            return jsonError(403, "supplier_access_denied", { message: "Bu hesap bir tedarikçi ile iliştirilmemiş." });
        }

        const body = await req.json();

        // Allowed fields to update
        const allowedFields = [
            "contactName", "email", "phone", "website", "address",
            "bankName", "bankBranch", "bankIban", "bankAccountNo", "bankCurrency",
            "notes"
        ];

        // Filter only allowed fields
        const updateData: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return jsonError(400, "no_fields", { message: "Güncellenecek alan bulunamadı." });
        }

        // Update tenant (supplier)
        const updated = await prisma.tenant.update({
            where: { id: user.tenantId, isSupplier: true },
            data: updateData,
            select: {
                id: true,
                name: true,
                contactName: true,
                email: true,
                phone: true,
                website: true,
                address: true,
                bankName: true,
                bankIban: true,
                updatedAt: true
            }
        });

        return NextResponse.json({ success: true, profile: updated });
    } catch (e: unknown) {
        console.error("[Portal Profile Update Error]", e);
        const message = e instanceof Error ? e.message : "Unknown error";
        return jsonError(500, "server_error", { message });
    }
}
