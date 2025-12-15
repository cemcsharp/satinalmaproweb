import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

// GET - List all delivery addresses
export async function GET(req: NextRequest) {
    try {
        const { getUserWithPermissions } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");

        const { searchParams } = new URL(req.url);
        const activeOnly = searchParams.get("active") === "true";

        const addresses = await prisma.deliveryAddress.findMany({
            where: activeOnly ? { active: true } : {},
            orderBy: [{ isDefault: "desc" }, { name: "asc" }],
        });

        return NextResponse.json({ items: addresses });
    } catch (e: any) {
        console.error("DeliveryAddress GET Error:", e);
        return jsonError(500, "server_error");
    }
}

// POST - Create new delivery address
export async function POST(req: NextRequest) {
    try {
        const { getUserWithPermissions, userHasPermission } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");
        if (!user.isAdmin && !userHasPermission(user, "ayarlar:update")) {
            return jsonError(403, "forbidden");
        }

        const body = await req.json();
        const { name, address, city, district, postalCode, phone, contactPerson, isDefault } = body;

        if (!name || !address) {
            return jsonError(400, "missing_fields", { message: "Ad ve adres zorunludur." });
        }

        // If setting as default, unset other defaults first
        if (isDefault) {
            await prisma.deliveryAddress.updateMany({
                where: { isDefault: true },
                data: { isDefault: false },
            });
        }

        const newAddress = await prisma.deliveryAddress.create({
            data: {
                name,
                address,
                city,
                district,
                postalCode,
                phone,
                contactPerson,
                isDefault: isDefault || false,
            },
        });

        return NextResponse.json({ ok: true, item: newAddress });
    } catch (e: any) {
        console.error("DeliveryAddress POST Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}

// PATCH - Update delivery address
export async function PATCH(req: NextRequest) {
    try {
        const { getUserWithPermissions, userHasPermission } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");
        if (!user.isAdmin && !userHasPermission(user, "ayarlar:update")) {
            return jsonError(403, "forbidden");
        }

        const body = await req.json();
        const { id, name, address, city, district, postalCode, phone, contactPerson, active, isDefault } = body;

        if (!id) {
            return jsonError(400, "missing_fields", { message: "ID zorunludur." });
        }

        // If setting as default, unset other defaults first
        if (isDefault) {
            await prisma.deliveryAddress.updateMany({
                where: { isDefault: true, id: { not: id } },
                data: { isDefault: false },
            });
        }

        const updated = await prisma.deliveryAddress.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(address !== undefined && { address }),
                ...(city !== undefined && { city }),
                ...(district !== undefined && { district }),
                ...(postalCode !== undefined && { postalCode }),
                ...(phone !== undefined && { phone }),
                ...(contactPerson !== undefined && { contactPerson }),
                ...(active !== undefined && { active }),
                ...(isDefault !== undefined && { isDefault }),
            },
        });

        return NextResponse.json({ ok: true, item: updated });
    } catch (e: any) {
        console.error("DeliveryAddress PATCH Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}

// DELETE - Delete delivery address
export async function DELETE(req: NextRequest) {
    try {
        const { getUserWithPermissions, userHasPermission } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");
        if (!user.isAdmin && !userHasPermission(user, "ayarlar:update")) {
            return jsonError(403, "forbidden");
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return jsonError(400, "missing_fields", { message: "ID zorunludur." });
        }

        await prisma.deliveryAddress.delete({ where: { id } });

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        console.error("DeliveryAddress DELETE Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}
