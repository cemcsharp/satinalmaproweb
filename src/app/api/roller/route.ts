import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureAdminApi } from "@/lib/apiAuth";
import { jsonError } from "@/lib/apiError";

// Default permissions structure
const DEFAULT_PERMISSIONS = {
    talep: ["read", "write", "delete"],
    siparis: ["read", "write", "delete"],
    teslimat: ["read", "write", "delete"],
    fatura: ["read", "write", "delete"],
    sozlesme: ["read", "write", "delete"],
    tedarikci: ["read", "write", "delete"],
    kullanicilar: ["read", "write", "delete"],
    ayarlar: ["read", "write", "delete"],
};

const MODULES = [
    { key: "talep", name: "Talep Yönetimi" },
    { key: "siparis", name: "Sipariş Yönetimi" },
    { key: "teslimat", name: "Teslimat Yönetimi" },
    { key: "fatura", name: "Fatura Yönetimi" },
    { key: "sozlesme", name: "Sözleşme Yönetimi" },
    { key: "tedarikci", name: "Tedarikçi Yönetimi" },
    { key: "kullanicilar", name: "Kullanıcı Yönetimi" },
    { key: "ayarlar", name: "Sistem Ayarları" },
];

// GET - List all roles
export async function GET(req: NextRequest) {
    try {
        const admin = await ensureAdminApi(req);
        if (!admin) return jsonError(403, "forbidden");

        const roles = await prisma.role.findMany({
            orderBy: { createdAt: "asc" },
            include: { _count: { select: { users: true } } },
        });

        return NextResponse.json({
            items: roles.map((r) => ({
                ...r,
                userCount: r._count.users,
            })),
            modules: MODULES,
        });
    } catch (e) {
        console.error(e);
        return jsonError(500, "server_error");
    }
}

// POST - Create a new role
export async function POST(req: NextRequest) {
    try {
        const admin = await ensureAdminApi(req);
        if (!admin) return jsonError(403, "forbidden");

        const body = await req.json();
        const { name, key, description, permissions } = body;

        if (!name || !key) return jsonError(400, "name_and_key_required");

        // Check uniqueness
        const existing = await prisma.role.findFirst({
            where: { OR: [{ name }, { key }] },
        });
        if (existing) return jsonError(409, "role_already_exists");

        const role = await prisma.role.create({
            data: {
                name,
                key: key.toLowerCase().replace(/\s+/g, "_"),
                description: description || null,
                permissions: permissions || {},
                isSystem: false,
            },
        });

        return NextResponse.json(role, { status: 201 });
    } catch (e) {
        console.error(e);
        return jsonError(500, "server_error");
    }
}

// PUT - Update a role
export async function PUT(req: NextRequest) {
    try {
        const admin = await ensureAdminApi(req);
        if (!admin) return jsonError(403, "forbidden");

        const body = await req.json();
        const { id, name, description, permissions } = body;

        if (!id) return jsonError(400, "id_required");

        const existing = await prisma.role.findUnique({ where: { id } });
        if (!existing) return jsonError(404, "role_not_found");

        // System roles cannot change key
        const updateData: any = {};
        if (name) updateData.name = name;
        if (typeof description !== "undefined") updateData.description = description;
        if (permissions) updateData.permissions = permissions;

        const role = await prisma.role.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(role);
    } catch (e) {
        console.error(e);
        return jsonError(500, "server_error");
    }
}

// DELETE - Delete a role
export async function DELETE(req: NextRequest) {
    try {
        const admin = await ensureAdminApi(req);
        if (!admin) return jsonError(403, "forbidden");

        const url = new URL(req.url);
        const id = url.searchParams.get("id");

        if (!id) return jsonError(400, "id_required");

        const existing = await prisma.role.findUnique({ where: { id } });
        if (!existing) return jsonError(404, "role_not_found");

        if (existing.isSystem) {
            return jsonError(400, "cannot_delete_system_role");
        }

        // Check if any users are using this role
        const usersWithRole = await prisma.user.count({ where: { roleId: id } });
        if (usersWithRole > 0) {
            return jsonError(409, "role_in_use", {
                message: `Bu rol ${usersWithRole} kullanıcı tarafından kullanılıyor. Önce kullanıcıların rolünü değiştirin.`
            });
        }

        await prisma.role.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error(e);
        return jsonError(500, "server_error");
    }
}
