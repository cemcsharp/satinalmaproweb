import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

// GET: Sistem ayarlarını getir
export async function GET(req: NextRequest) {
    try {
        const { getUserWithPermissions } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");

        const { searchParams } = new URL(req.url);
        const group = searchParams.get("group");
        const key = searchParams.get("key");

        // Tek bir ayarı getir
        if (key) {
            const setting = await prisma.systemSetting.findUnique({ where: { key } });
            if (!setting) {
                return NextResponse.json({ key, value: null, exists: false });
            }
            return NextResponse.json(setting);
        }

        // Grup veya tüm ayarları getir
        const where = group ? { group } : {};
        const settings = await prisma.systemSetting.findMany({
            where,
            orderBy: { key: "asc" }
        });

        // Key-value map olarak dön (kolay erişim için)
        const map: Record<string, any> = {};
        settings.forEach(s => {
            if (s.type === "boolean") {
                map[s.key] = s.value === "true";
            } else if (s.type === "json") {
                try { map[s.key] = JSON.parse(s.value); } catch { map[s.key] = s.value; }
            } else {
                map[s.key] = s.value;
            }
        });

        return NextResponse.json({ items: settings, map });

    } catch (e: any) {
        console.error("SystemSetting GET Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}

// POST: Sistem ayarı oluştur veya güncelle (Upsert)
export async function POST(req: NextRequest) {
    try {
        const { getUserWithPermissions } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");

        // Sadece admin değiştirebilir
        if (!user.isAdmin) {
            return jsonError(403, "forbidden", { message: "Sistem ayarlarını yalnızca admin değiştirebilir." });
        }

        const body = await req.json();
        const { key, value, type, label, group } = body;

        if (!key) {
            return jsonError(400, "missing_key");
        }

        const before = await prisma.systemSetting.findUnique({ where: { key } });

        const setting = await prisma.systemSetting.upsert({
            where: { key },
            update: {
                value: String(value),
                type: type || "boolean",
                label: label || undefined,
                group: group || undefined
            },
            create: {
                key,
                value: String(value),
                type: type || "boolean",
                label: label || null,
                group: group || null
            }
        });

        const { logAuditWithRequest } = await import("@/lib/auditLogger");
        await logAuditWithRequest(req, {
            userId: user.id,
            action: before ? "UPDATE" : "CREATE",
            entityType: "System",
            entityId: key,
            oldData: before,
            newData: setting
        }).catch(() => { });

        return NextResponse.json(setting);

    } catch (e: any) {
        console.error("SystemSetting POST Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}

// DELETE: Sistem ayarı sil
export async function DELETE(req: NextRequest) {
    try {
        const { getUserWithPermissions } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");

        if (!user.isAdmin) {
            return jsonError(403, "forbidden");
        }

        const { searchParams } = new URL(req.url);
        const key = searchParams.get("key");

        if (!key) {
            return jsonError(400, "missing_key");
        }

        const before = await prisma.systemSetting.findUnique({ where: { key } });

        await prisma.systemSetting.delete({ where: { key } });

        const { logAuditWithRequest } = await import("@/lib/auditLogger");
        await logAuditWithRequest(req, {
            userId: user.id,
            action: "DELETE",
            entityType: "System",
            entityId: key,
            oldData: before,
            newData: null
        }).catch(() => { });

        return NextResponse.json({ ok: true });

    } catch (e: any) {
        console.error("SystemSetting DELETE Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}
