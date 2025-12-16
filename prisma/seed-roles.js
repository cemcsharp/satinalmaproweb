const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Varsayılan roller ve izinleri
const DEFAULT_ROLES = [
    {
        name: "Sistem Yöneticisi",
        key: "admin",
        description: "Tüm sistem yetkilerine sahip yönetici",
        isSystem: true,
        sortOrder: 1,
        permissions: [
            // Tüm izinler
            "talep:read", "talep:create", "talep:edit", "talep:delete",
            "siparis:read", "siparis:create", "siparis:edit", "siparis:delete",
            "fatura:read", "fatura:create", "fatura:edit", "fatura:delete",
            "sozlesme:read", "sozlesme:create", "sozlesme:edit", "sozlesme:delete",
            "tedarikci:read", "tedarikci:create", "tedarikci:edit", "tedarikci:delete",
            "teslimat:read", "teslimat:create", "teslimat:edit", "teslimat:delete",
            "evaluation:submit", "rapor:read",
            "ayarlar:read", "ayarlar:edit", "user:manage", "role:manage",
            "rfq:read", "rfq:create", "rfq:edit", "rfq:delete",
            "urun:read", "urun:create", "urun:edit", "urun:delete"
        ]
    },
    {
        name: "Satınalma Müdürü",
        key: "satinalma_muduru",
        description: "Satınalma departmanı yöneticisi",
        isSystem: true,
        sortOrder: 2,
        permissions: [
            "talep:read", "talep:edit", "talep:delete",
            "siparis:read", "siparis:create", "siparis:edit", "siparis:delete",
            "fatura:read", "fatura:create", "fatura:edit",
            "sozlesme:read", "sozlesme:create", "sozlesme:edit",
            "tedarikci:read", "tedarikci:create", "tedarikci:edit", "tedarikci:delete",
            "teslimat:read", "teslimat:edit",
            "evaluation:submit", "rapor:read",
            "ayarlar:read", "ayarlar:edit", "user:manage",
            "rfq:read", "rfq:create", "rfq:edit", "rfq:delete",
            "urun:read", "urun:create", "urun:edit"
        ]
    },
    {
        name: "Satınalma Uzmanı",
        key: "satinalma_uzmani",
        description: "Satınalma departmanı çalışanı",
        isSystem: true,
        sortOrder: 3,
        permissions: [
            "talep:read", "talep:edit",
            "siparis:read", "siparis:create", "siparis:edit",
            "fatura:read", "fatura:create",
            "sozlesme:read",
            "tedarikci:read", "tedarikci:create", "tedarikci:edit",
            "teslimat:read", "teslimat:edit",
            "evaluation:submit", "rapor:read",
            "rfq:read", "rfq:create", "rfq:edit",
            "urun:read"
        ]
    },
    {
        name: "Birim Müdürü",
        key: "birim_muduru",
        description: "Departman/birim yöneticisi",
        isSystem: true,
        sortOrder: 4,
        permissions: [
            "talep:read", "talep:create", "talep:edit",
            "siparis:read",
            "teslimat:read",
            "evaluation:submit",
            "rapor:read"
        ]
    },
    {
        name: "Birim Kullanıcısı",
        key: "birim_kullanicisi",
        description: "Standart birim çalışanı",
        isSystem: true,
        sortOrder: 5,
        permissions: [
            "talep:read", "talep:create",
            "siparis:read",
            "teslimat:read"
        ]
    },
    {
        name: "Depo Görevlisi",
        key: "depo_gorevlisi",
        description: "Depo ve teslimat işlemleri",
        isSystem: true,
        sortOrder: 6,
        permissions: [
            "teslimat:read", "teslimat:create", "teslimat:edit",
            "siparis:read"
        ]
    },
    {
        name: "Standart Kullanıcı",
        key: "user",
        description: "Temel kullanıcı yetkileri",
        isSystem: true,
        sortOrder: 99,
        permissions: [
            "talep:read", "talep:create"
        ]
    }
];

async function main() {
    console.log('🔐 Roller oluşturuluyor...\n');

    for (const role of DEFAULT_ROLES) {
        const existing = await prisma.role.findUnique({ where: { key: role.key } });

        if (existing) {
            // Mevcut rolü güncelle
            await prisma.role.update({
                where: { key: role.key },
                data: {
                    name: role.name,
                    description: role.description,
                    permissions: role.permissions,
                    isSystem: role.isSystem,
                    sortOrder: role.sortOrder
                }
            });
            console.log(`✅ Güncellendi: ${role.name} (${role.key})`);
        } else {
            // Yeni rol oluştur
            await prisma.role.create({
                data: {
                    name: role.name,
                    key: role.key,
                    description: role.description,
                    permissions: role.permissions,
                    isSystem: role.isSystem,
                    sortOrder: role.sortOrder,
                    active: true
                }
            });
            console.log(`✅ Oluşturuldu: ${role.name} (${role.key})`);
        }
    }

    // Admin kullanıcısını admin rolüne bağla
    const adminRole = await prisma.role.findUnique({ where: { key: "admin" } });
    if (adminRole) {
        const adminUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: "admin" },
                    { email: "admin@sirket.com" }
                ]
            }
        });

        if (adminUser) {
            await prisma.user.update({
                where: { id: adminUser.id },
                data: { roleId: adminRole.id, role: "admin" }
            });
            console.log(`\n✅ Admin kullanıcısı admin rolüne bağlandı.`);
        }
    }

    console.log('\n🎉 Rol seed işlemi tamamlandı!');
}

main()
    .catch(e => {
        console.error('❌ Hata:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
