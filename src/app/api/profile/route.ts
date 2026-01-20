import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import type { Role } from "@/lib/apiAuth";
import { getPermissionInfo } from "@/lib/permissions";



export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return NextResponse.json({ error: "unauthorized", debug: { session } }, { status: 401 });
        }

        // Fetch user with roleRef
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                unit: true,
                roleRef: true
            },
        });

        if (!user) {
            return NextResponse.json({ error: "user_not_found" }, { status: 404 });
        }

        // Determine actual role strictly from user record
        const roleKey: string = user.role || "user";

        let permissions: string[] = [];

        if (user.roleRef && user.roleRef.permissions) {
            // Extract dynamic permissions from JSON (user has roleId linked)
            const dbPerms = user.roleRef.permissions;

            if (Array.isArray(dbPerms)) {
                permissions = dbPerms as string[];
            } else if (typeof dbPerms === 'object' && dbPerms !== null) {
                // Handle legacy object format if still present
                permissions = Object.keys(dbPerms).filter(k => (dbPerms as any)[k]);
            }
        } else if (roleKey) {
            // FALLBACK: User has role string but no roleId linkage
            // Fetch permissions directly from Role table by key
            const roleRecord = await prisma.role.findUnique({
                where: { key: roleKey }
            });
            if (roleRecord && Array.isArray(roleRecord.permissions)) {
                permissions = roleRecord.permissions as string[];
            } else if (roleKey === "admin") {
                // Ultimate fallback for admin
                const { ALL_PERMISSIONS } = await import("@/lib/permissions");
                permissions = [...ALL_PERMISSIONS];
            }
        }

        return NextResponse.json({
            id: user.id,
            username: user.username,
            email: user.email,
            phoneNumber: (user as any).phoneNumber || null,
            role: roleKey,
            roleName: user.roleRef?.name || roleKey,
            createdAt: user.createdAt,
            lastLoginAt: (user as any).lastLoginAt || null,
            unitId: user.unitId,
            unitLabel: user.unit?.label || null,
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
            return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));

        const { username, phoneNumber } = body;

        const data: any = {};
        if (username !== undefined) data.username = username.trim();
        if (phoneNumber !== undefined) data.phoneNumber = phoneNumber.trim();

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: "no_data_provided" }, { status: 400 });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                username: true,
                email: true,
                phoneNumber: true,
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
