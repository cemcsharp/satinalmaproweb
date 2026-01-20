import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

// GET: List all roles
export async function GET(req: NextRequest) {
    try {
        const { getUserWithPermissions } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");

        const roles = await prisma.role.findMany({
            where: { active: true },
            orderBy: { sortOrder: "asc" },
            include: {
                _count: { select: { users: true } }
            }
        });

        const items = roles.map(r => ({
            id: r.id,
            name: r.name,
            key: r.key,
            description: r.description,
            permissions: r.permissions,
            isSystem: r.isSystem,
            sortOrder: r.sortOrder,
            userCount: r._count.users
        }));

        return NextResponse.json({ items });

    } catch (e: any) {
        console.error("Roles GET Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}

// POST: Create new role
export async function POST(req: NextRequest) {
    try {
        const { getUserWithPermissions, userHasPermission } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");
        if (!userHasPermission(user, "role:manage")) return jsonError(403, "forbidden");

        const body = await req.json();
        const { name, key, description, permissions } = body;

        if (!name || !key) {
            return jsonError(400, "name_and_key_required");
        }

        // Check if key already exists
        const existing = await prisma.role.findUnique({ where: { key } });
        if (existing) {
            return jsonError(409, "key_already_exists");
        }

        // Get max sortOrder
        const maxSort = await prisma.role.aggregate({ _max: { sortOrder: true } });
        const nextSort = (maxSort._max.sortOrder ?? 0) + 1;

        const role = await prisma.role.create({
            data: {
                name,
                key: key.toLowerCase().replace(/\s+/g, '_'),
                description: description || null,
                permissions: Array.isArray(permissions) ? permissions : [],
                isSystem: false,
                active: true,
                sortOrder: nextSort
            }
        });

        const { logAuditWithRequest } = await import("@/lib/auditLogger");
        await logAuditWithRequest(req, {
            userId: user.id,
            action: "CREATE",
            entityType: "Role",
            entityId: role.id,
            newData: role
        }).catch(() => { });

        return NextResponse.json(role, { status: 201 });

    } catch (e: any) {
        console.error("Roles POST Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}
