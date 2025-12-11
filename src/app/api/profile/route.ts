import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import type { Role } from "@/lib/apiAuth";

// Admin emails
const ADMIN_EMAILS = ["admin@sirket.com", "admin@satinalmapro.com"];

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return NextResponse.json({ error: "unauthorized", debug: { session } }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { roleRef: true },
        });

        if (!user) {
            return NextResponse.json({ error: "user_not_found" }, { status: 404 });
        }

        // Determine actual role
        let roleKey: Role = (user.role as Role) || "user";
        let permissions: string[] = [];
        let roleName = roleKey;

        // Admin override by email
        if (user.email && ADMIN_EMAILS.includes(String(user.email).toLowerCase())) {
            roleKey = "admin";
        }

        // Get permissions from roleRef or fallback to role key lookup
        if (user.roleRef && user.roleRef.permissions) {
            const rolePerms = user.roleRef.permissions as Record<string, string[]>;
            Object.entries(rolePerms).forEach(([module, actions]) => {
                (actions || []).forEach((action) => {
                    permissions.push(`${module}:${action}`);
                });
            });
            roleKey = user.roleRef.key as Role;
            roleName = user.roleRef.name;
        } else {
            // Fallback: lookup by role key
            const roleFromDb = await prisma.role.findUnique({ where: { key: roleKey } });
            if (roleFromDb && roleFromDb.permissions) {
                const rolePerms = roleFromDb.permissions as Record<string, string[]>;
                Object.entries(rolePerms).forEach(([module, actions]) => {
                    (actions || []).forEach((action) => {
                        permissions.push(`${module}:${action}`);
                    });
                });
                roleName = roleFromDb.name;
            }
        }

        return NextResponse.json({
            id: user.id,
            username: user.username,
            email: user.email,
            role: roleKey,
            roleName,
            createdAt: user.createdAt,
            unitId: user.unitId,
            permissions,
            isAdmin: roleKey === "admin",
        });
    } catch (e: any) {
        console.error("[Profile API GET] Error:", e);
        return NextResponse.json({ error: e?.message || "unknown" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return NextResponse.json({ error: "unauthorized", debug: { hasSession: !!session, user: session?.user } }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));

        const { username } = body;

        if (!username || typeof username !== "string" || !username.trim()) {
            return NextResponse.json({ error: "username_required" }, { status: 400 });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { username: username.trim() },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
            },
        });

        return NextResponse.json({ ok: true, user });
    } catch (e: any) {
        console.error("[Profile API PUT] Error:", e);
        const code = (e as any)?.code;
        if (code === "P2002") {
            return NextResponse.json({ error: "username_taken" }, { status: 409 });
        }
        return NextResponse.json({ error: e?.message || "unknown", code }, { status: 500 });
    }
}
