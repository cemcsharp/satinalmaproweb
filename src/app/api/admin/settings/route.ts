import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// GET: Fetch all system settings
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Get all settings (admin or public)
        const allSettings = await prisma.systemSettings.findMany();

        const settingsMap: Record<string, string> = {};
        allSettings.forEach((s: any) => {
            settingsMap[s.key] = s.value;
        });

        return NextResponse.json({ ok: true, settings: settingsMap });
    } catch (error) {
        console.error("Settings GET error:", error);
        return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
}

// POST: Update system settings (admin only)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if ((session?.user as any)?.role !== "admin") {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { settings } = body; // { key: value, key2: value2, ... }

        if (!settings || typeof settings !== "object") {
            return NextResponse.json({ error: "invalid_data" }, { status: 400 });
        }

        // Upsert each setting
        for (const [key, value] of Object.entries(settings)) {
            await prisma.systemSettings.upsert({
                where: { key },
                update: {
                    value: String(value),
                    updatedAt: new Date()
                },
                create: {
                    key,
                    value: String(value),
                    type: "string",
                    label: key
                }
            });
        }

        return NextResponse.json({ ok: true, message: "Ayarlar kaydedildi" });
    } catch (error) {
        console.error("Settings POST error:", error);
        return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
}
