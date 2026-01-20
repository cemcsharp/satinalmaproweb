import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

// Varsayılan modül listesi ve roller
// ÖNEMLI: key değerleri Sidebar.tsx'deki moduleKey değerleriyle eşleşmeli!
const DEFAULT_MODULES = [
    { key: "talep", label: "Talep Yönetimi", defaultRoles: ["admin", "satinalma_muduru", "satinalma_uzmani", "birim_muduru", "birim_kullanicisi"] },
    { key: "rfq", label: "Teklif (RFQ)", defaultRoles: ["admin", "satinalma_muduru"] },
    { key: "siparis", label: "Sipariş Yönetimi", defaultRoles: ["admin", "satinalma_muduru", "satinalma_uzmani"] },
    { key: "teslimat", label: "Teslimat", defaultRoles: ["admin", "satinalma_muduru", "satinalma_uzmani"] },
    { key: "sozlesme", label: "Sözleşme", defaultRoles: ["admin", "satinalma_muduru"] },
    { key: "fatura", label: "Fatura", defaultRoles: ["admin", "satinalma_muduru"] },
    { key: "tedarikci", label: "Tedarikçi", defaultRoles: ["admin", "satinalma_muduru", "satinalma_uzmani"] },
    { key: "urun", label: "Ürün Kataloğu", defaultRoles: ["admin", "satinalma_muduru"] },
    { key: "raporlama", label: "Raporlama", defaultRoles: ["admin", "satinalma_muduru"] },
];

const ALL_ROLES = [
    { key: "admin", label: "Sistem Yöneticisi" },
    { key: "satinalma_muduru", label: "Satınalma Müdürü" },
    { key: "satinalma_uzmani", label: "Satınalma Uzmanı" },
    { key: "birim_muduru", label: "Birim Müdürü" },
    { key: "birim_kullanicisi", label: "Birim Kullanıcısı" },
];

// GET: Tüm modül erişimlerini getir
export async function GET(req: NextRequest) {
    try {
        const { getUserWithPermissions } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");

        // Sadece admin erişebilir (UI için)
        // Ancak tüm kullanıcılar kendi erişimlerini kontrol etmeli (public endpoint)
        const { searchParams } = new URL(req.url);
        const checkAccess = searchParams.get("check"); // Belirli bir modül için erişim kontrolü
        const roleKey = searchParams.get("role");

        // Tek modül erişim kontrolü (herkes için)
        if (checkAccess && roleKey) {
            const access = await prisma.moduleAccess.findUnique({
                where: { moduleKey_roleKey: { moduleKey: checkAccess, roleKey } }
            });
            // Kayıt yoksa varsayılan değeri kontrol et
            const defaultModule = DEFAULT_MODULES.find(m => m.key === checkAccess);
            const hasAccess = access ? access.enabled : (defaultModule?.defaultRoles.includes(roleKey) ?? false);
            return NextResponse.json({ hasAccess });
        }

        // Tam liste - tüm giriş yapmış kullanıcılar okuyabilir (sidebar için gerekli)
        // POST işlemleri sadece admin yapabilir

        // Tüm modül-rol erişimlerini getir
        const accessList = await prisma.moduleAccess.findMany({
            orderBy: [{ moduleKey: "asc" }, { roleKey: "asc" }]
        });

        // Modül aktiflik durumlarını getir
        const moduleSettings = await prisma.systemSettings.findMany({
            where: { category: "modules" }
        });

        // Yapıyı düzenle
        const moduleMap: Record<string, { enabled: boolean; roles: Record<string, boolean> }> = {};

        for (const mod of DEFAULT_MODULES) {
            const setting = moduleSettings.find(s => s.key === `${mod.key}_module_enabled`);
            moduleMap[mod.key] = {
                enabled: setting ? setting.value === "true" : true,
                roles: {}
            };

            // Varsayılan rol erişimlerini ayarla
            for (const role of ALL_ROLES) {
                moduleMap[mod.key].roles[role.key] = mod.defaultRoles.includes(role.key);
            }
        }

        // Veritabanındaki özel ayarları uygula
        for (const access of accessList) {
            if (moduleMap[access.moduleKey]) {
                moduleMap[access.moduleKey].roles[access.roleKey] = access.enabled;
            }
        }

        return NextResponse.json({
            modules: DEFAULT_MODULES,
            roles: ALL_ROLES,
            access: moduleMap
        });

    } catch (e: any) {
        console.error("ModuleAccess GET Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}

// POST: Modül erişimini güncelle
export async function POST(req: NextRequest) {
    try {
        const { getUserWithPermissions } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");

        // Sadece admin değiştirebilir
        if (!user.isAdmin) {
            return jsonError(403, "forbidden");
        }

        const body = await req.json();
        const { moduleKey, roleKey, enabled, moduleEnabled } = body;

        // Modül aktiflik durumunu güncelle
        if (moduleEnabled !== undefined && moduleKey) {
            await prisma.systemSetting.upsert({
                where: { key: `${moduleKey}_module_enabled` },
                update: { value: moduleEnabled ? "true" : "false" },
                create: {
                    key: `${moduleKey}_module_enabled`,
                    value: moduleEnabled ? "true" : "false",
                    type: "boolean",
                    group: "modules",
                    label: DEFAULT_MODULES.find(m => m.key === moduleKey)?.label
                }
            });
            return NextResponse.json({ ok: true, type: "module_enabled" });
        }

        // Rol erişimini güncelle
        if (!moduleKey || !roleKey) {
            return jsonError(400, "missing_fields");
        }

        const result = await prisma.moduleAccess.upsert({
            where: { moduleKey_roleKey: { moduleKey, roleKey } },
            update: { enabled },
            create: { moduleKey, roleKey, enabled }
        });

        return NextResponse.json({ ok: true, result });

    } catch (e: any) {
        console.error("ModuleAccess POST Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}
