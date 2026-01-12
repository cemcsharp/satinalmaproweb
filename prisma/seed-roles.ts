import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Default roles with their permissions based on approved matrix
const defaultRoles = [
    {
        key: "admin",
        name: "admin",
        displayName: "Sistem Yöneticisi",
        isSystem: true,
        permissions: [
            "talep:create", "talep:read", "talep:edit", "talep:delete",
            "siparis:create", "siparis:read", "siparis:edit", "siparis:delete",
            "fatura:create", "fatura:read", "fatura:edit", "fatura:delete",
            "sozlesme:create", "sozlesme:read", "sozlesme:edit", "sozlesme:delete",
            "tedarikci:create", "tedarikci:read", "tedarikci:edit", "tedarikci:delete",
            "evaluation:submit",
            "rapor:read",
            "user:manage", "role:manage"
        ]
    },
    {
        key: "purchasing_manager",
        name: "purchasing_manager",
        displayName: "Satın Alma Müdürü",
        isSystem: true,
        permissions: [
            "talep:create", "talep:read", "talep:edit", "talep:delete",
            "siparis:create", "siparis:read", "siparis:edit", "siparis:delete",
            "fatura:create", "fatura:read", "fatura:edit", "fatura:delete",
            "sozlesme:create", "sozlesme:read", "sozlesme:edit", "sozlesme:delete",
            "tedarikci:create", "tedarikci:read", "tedarikci:edit", "tedarikci:delete",
            "evaluation:submit",
            "rapor:read"
        ]
    },
    {
        key: "purchasing_specialist",
        name: "purchasing_specialist",
        displayName: "Satın Alma Uzmanı",
        isSystem: true,
        permissions: [
            // Same as Satın Alma Müdürü
            "talep:create", "talep:read", "talep:edit", "talep:delete",
            "siparis:create", "siparis:read", "siparis:edit", "siparis:delete",
            "fatura:create", "fatura:read", "fatura:edit", "fatura:delete",
            "sozlesme:create", "sozlesme:read", "sozlesme:edit", "sozlesme:delete",
            "tedarikci:create", "tedarikci:read", "tedarikci:edit", "tedarikci:delete",
            "evaluation:submit",
            "rapor:read"
        ]
    },
    {
        key: "unit_manager",
        name: "unit_manager",
        displayName: "Birim Müdürü",
        isSystem: true,
        permissions: [
            "talep:create", "talep:read",
            "siparis:read",
            "sozlesme:read",
            "tedarikci:read",
            "evaluation:submit"
        ]
    },
    {
        key: "unit_user",
        name: "unit_user",
        displayName: "Birim Kullanıcısı",
        isSystem: true,
        permissions: [
            "talep:create", "talep:read",
            "sozlesme:read",
            "tedarikci:read",
            "evaluation:submit"
        ]
    },
    {
        key: "birim_evaluator",
        name: "birim_evaluator",
        displayName: "Değerlendirici",
        isSystem: true,
        permissions: [
            "evaluation:submit",
            "tedarikci:read"
        ]
    },
    {
        key: "supplier",
        name: "supplier",
        displayName: "Tedarikçi",
        isSystem: true,
        permissions: [
            "portal:view", "rfq:submit"
        ]
    }
];

async function seedRoles() {
    console.log("🔄 Seeding roles...");

    for (const role of defaultRoles) {
        const existing = await prisma.role.findUnique({ where: { key: role.key } });

        if (existing) {
            // Update existing role with new permissions
            await prisma.role.update({
                where: { key: role.key },
                data: {
                    name: role.displayName,
                    permissions: role.permissions,
                    isSystem: role.isSystem
                }
            });
            console.log(`✅ Updated role: ${role.displayName}`);
        } else {
            // Create new role
            await prisma.role.create({
                data: {
                    key: role.key,
                    name: role.displayName,
                    isSystem: role.isSystem,
                    permissions: role.permissions
                }
            });
            console.log(`✅ Created role: ${role.displayName}`);
        }
    }

    console.log("✅ Roles seeding completed!");
}

seedRoles()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error("❌ Error seeding roles:", e);
        prisma.$disconnect();
        process.exit(1);
    });
