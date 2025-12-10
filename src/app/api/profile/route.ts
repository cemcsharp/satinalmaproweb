import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        console.log("[Profile API GET] Session:", JSON.stringify(session, null, 2));

        const userId = (session?.user as any)?.id;
        console.log("[Profile API GET] User ID:", userId);

        if (!userId) {
            return NextResponse.json({ error: "unauthorized", debug: { session } }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "user_not_found" }, { status: 404 });
        }

        // Permissions system removed
        const permissions: string[] = [];

        return NextResponse.json({
            ...user,
            permissions,
        });
    } catch (e: any) {
        console.error("[Profile API GET] Error:", e);
        return NextResponse.json({ error: e?.message || "unknown" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        console.log("[Profile API PUT] Session:", JSON.stringify(session, null, 2));

        const userId = (session?.user as any)?.id;
        console.log("[Profile API PUT] User ID:", userId);

        if (!userId) {
            console.log("[Profile API PUT] Unauthorized - no user ID");
            return NextResponse.json({ error: "unauthorized", debug: { hasSession: !!session, user: session?.user } }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        console.log("[Profile API PUT] Body:", body);

        const { username } = body;

        if (!username || typeof username !== "string" || !username.trim()) {
            return NextResponse.json({ error: "username_required" }, { status: 400 });
        }

        console.log("[Profile API PUT] Updating user:", userId, "with username:", username.trim());

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

        console.log("[Profile API PUT] Updated user:", user);
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
