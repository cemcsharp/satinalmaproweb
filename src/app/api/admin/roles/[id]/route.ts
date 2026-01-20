import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

// GET: Get single role
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { getUserWithPermissions } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");

        const { id } = await params;

        const role = await prisma.role.findUnique({
            where: { id },
            include: {
                _count: { select: { users: true } }
            }
        });

        if (!role) {
            return jsonError(404, "not_found");
        }

        return NextResponse.json({
            ...role,
            userCount: role._count.users
        });

    } catch (e: any) {
        console.error("Role GET Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}

// PATCH: Update role
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { getUserWithPermissions, userHasPermission } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");
        if (!userHasPermission(user, "role:manage")) return jsonError(403, "forbidden");

        const { id } = await params;
        const body = await req.json();

        // Check if role exists
        const existing = await prisma.role.findUnique({ where: { id } });
        if (!existing) {
            return jsonError(404, "not_found");
        }

        // System roles can only update name and description
        const data: any = {};

        if (body.name !== undefined) data.name = body.name;
        if (body.description !== undefined) data.description = body.description;

        // Non-system roles can update key and permissions
        if (!existing.isSystem) {
            if (body.key !== undefined) data.key = body.key.toLowerCase().replace(/\s+/g, '_');
            if (body.permissions !== undefined) data.permissions = Array.isArray(body.permissions) ? body.permissions : [];
            if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);
        } else {
            // System roles can still update permissions
            if (body.permissions !== undefined) data.permissions = Array.isArray(body.permissions) ? body.permissions : [];
        }

        const role = await prisma.role.update({
            where: { id },
            data
        });

        const { logAuditWithRequest } = await import("@/lib/auditLogger");
        await logAuditWithRequest(req, {
            userId: user.id,
            action: "UPDATE",
            entityType: "Role",
            entityId: id,
            oldData: existing,
            newData: role
        }).catch(() => { });

        return NextResponse.json(role);

    } catch (e: any) {
        console.error("Role PATCH Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}

// DELETE: Delete role (soft delete by setting active = false)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { getUserWithPermissions, userHasPermission } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");
        if (!userHasPermission(user, "role:manage")) return jsonError(403, "forbidden");

        const { id } = await params;

        // Check if role exists
        const existing = await prisma.role.findUnique({
            where: { id },
            include: { _count: { select: { users: true } } }
        });

        if (!existing) {
            return jsonError(404, "not_found");
        }

        // Cannot delete system roles
        if (existing.isSystem) {
            return jsonError(400, "cannot_delete_system_role", {
                message: "Sistem rolleri silinemez."
            });
        }

        // Cannot delete roles with users
        if (existing._count.users > 0) {
            return jsonError(400, "role_has_users", {
                message: `Bu rol ${existing._count.users} kullanıcı tarafından kullanılıyor. Önce kullanıcıları başka role atayın.`
            });
        }

        // Soft delete
        const role = await prisma.role.update({
            where: { id },
            data: { active: false }
        });

        const { logAuditWithRequest } = await import("@/lib/auditLogger");
        await logAuditWithRequest(req, {
            userId: user.id,
            action: "DELETE",
            entityType: "Role",
            entityId: id,
            oldData: existing,
            newData: role
        }).catch(() => { });

        return NextResponse.json({ ok: true });

    } catch (e: any) {
        console.error("Role DELETE Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}
