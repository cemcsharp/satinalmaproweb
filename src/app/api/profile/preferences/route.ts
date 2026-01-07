import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        }

        const prefs = await prisma.notificationPreference.findUnique({
            where: { userId }
        });

        // If no prefs exist yet, return defaults
        if (!prefs) {
            return NextResponse.json({
                emailEnabled: true,
                inAppEnabled: true,
                compactView: false
            });
        }

        // Add additional logic to fetch other settings from somewhere or just return this
        return NextResponse.json(prefs);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// Preferences are handled via POST (upsert) to avoid 405 errors from partial implementations
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const { emailEnabled, inAppEnabled, digestEnabled } = body;

        const prefs = await prisma.notificationPreference.upsert({
            where: { userId },
            update: {
                emailEnabled: emailEnabled !== undefined ? emailEnabled : undefined,
                inAppEnabled: inAppEnabled !== undefined ? inAppEnabled : undefined,
                digestEnabled: digestEnabled !== undefined ? digestEnabled : undefined,
            },
            create: {
                userId,
                emailEnabled: emailEnabled !== undefined ? emailEnabled : true,
                inAppEnabled: inAppEnabled !== undefined ? inAppEnabled : true,
                digestEnabled: digestEnabled !== undefined ? digestEnabled : false,
            }
        });

        return NextResponse.json({ ok: true, prefs });
    } catch (e: any) {
        console.error("[Preferences API POST] Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
