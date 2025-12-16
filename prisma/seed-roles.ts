// Roller Seed Script
// Usage: npx tsx prisma/seed-roles.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 7 Standart Rol Tanımları
const standardRoles = [
    {
        name: "Sistem Admini",
        key: "admin",
        description: "Tüm sistem erişimi olan yönetici",
        permissions: [
            "talep:create", "talep:read", "talep:edit", "talep:delete", "talep:approve",
            "siparis:create", "siparis:read", "siparis:edit", "siparis:delete",
            "tedarikci:create", "tedarikci:read", "tedarikci:edit", "tedarikci:delete",
            "fatura:create", "fatura:read", "fatura:edit", "fatura:delete",
            "rfq:create", "rfq:read", "rfq:edit", "rfq:delete",
            "user:create", "user:read", "user:edit", "user:delete",
            "settings:read", "settings:edit",
            "reports:read", "reports:export"
        ],
        isSystem: true,
        sortOrder: 1
    },
    {
        name: "Genel Müdür",
        key: "genel_mudur",
        description: "Üst düzey onay ve raporlama yetkisi",
        permissions: [
            "talep:read", "talep:approve",
            "siparis:read", "siparis:approve",
            "reports:read", "reports:export",
            "dashboard:read"
        ],
        isSystem: true,
        sortOrder: 2
    },
    {
        name: "Satınalma Müdürü",
        key: "satinalma_muduru",
        description: "Satınalma departmanı yönetimi ve atama yetkisi",
        permissions: [
            "talep:read", "talep:assign", "talep:approve",
            "siparis:create", "siparis:read", "siparis:edit", "siparis:approve",
            "tedarikci:create", "tedarikci:read", "tedarikci:edit",
            "fatura:create", "fatura:read", "fatura:edit",
            "rfq:create", "rfq:read", "rfq:edit",
            "reports:read", "reports:export",
            "dashboard:read"
        ],
        isSystem: true,
        sortOrder: 3
    },
    {
        name: "Satınalma Personeli",
        key: "satinalma_personeli",
        description: "Satınalma operasyonları",
        permissions: [
            "talep:read",
            "siparis:create", "siparis:read", "siparis:edit",
            "tedarikci:read",
            "fatura:read",
            "rfq:create", "rfq:read", "rfq:edit",
            "dashboard:read"
        ],
        isSystem: true,
        sortOrder: 4
    },
    {
        name: "Birim Müdürü",
        key: "birim_muduru",
        description: "Birim taleplerini görüntüleme ve onaylama",
        permissions: [
            "talep:create", "talep:read", "talep:edit", "talep:approve",
            "reports:read",
            "dashboard:read"
        ],
        isSystem: true,
        sortOrder: 5
    },
    {
        name: "Birim Personeli",
        key: "birim_personeli",
        description: "Talep oluşturma ve kendi birim taleplerini görüntüleme",
        permissions: [
            "talep:create", "talep:read",
            "dashboard:read"
        ],
        isSystem: true,
        sortOrder: 6
    },
    {
        name: "Firma Yetkilisi",
        key: "firma_yetkilisi",
        description: "Salt okunur raporlama erişimi",
        permissions: [
            "reports:read",
            "dashboard:read"
        ],
        isSystem: true,
        sortOrder: 7
    }
];

async function main() {
    console.log("🔄 Roller oluşturuluyor...");

    for (const role of standardRoles) {
        const existing = await prisma.role.findUnique({
            where: { key: role.key }
        });

        if (existing) {
            console.log(`  ⏭️  ${role.name} (${role.key}) zaten mevcut, güncelleniyor...`);
            await prisma.role.update({
                where: { key: role.key },
                data: {
                    name: role.name,
                    description: role.description,
                    permissions: role.permissions,
                    isSystem: role.isSystem,
                    sortOrder: role.sortOrder,
                    active: true
                }
            });
        } else {
            console.log(`  ✅ ${role.name} (${role.key}) oluşturuluyor...`);
            await prisma.role.create({
                data: role
            });
        }
    }

    console.log("\n✅ Tüm roller başarıyla oluşturuldu/güncellendi!");

    // Mevcut rolleri listele
    const allRoles = await prisma.role.findMany({
        orderBy: { sortOrder: "asc" },
        select: { key: true, name: true, sortOrder: true }
    });

    console.log("\n📋 Mevcut Roller:");
    allRoles.forEach(r => {
        console.log(`   ${r.sortOrder}. ${r.name} (${r.key})`);
    });
}

main()
    .catch(e => {
        console.error("Hata:", e);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
    });
