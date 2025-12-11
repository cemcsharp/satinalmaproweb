// Script to seed default roles
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const defaultRoles = [
    {
        name: "Sistem Yöneticisi",
        key: "admin",
        description: "Tüm modüllere tam erişim",
        isSystem: true,
        permissions: {
            talep: ["read", "write", "delete"],
            siparis: ["read", "write", "delete"],
            teslimat: ["read", "write", "delete"],
            fatura: ["read", "write", "delete"],
            sozlesme: ["read", "write", "delete"],
            tedarikci: ["read", "write", "delete"],
            kullanicilar: ["read", "write", "delete"],
            ayarlar: ["read", "write", "delete"],
        },
    },
    {
        name: "Birim Yöneticisi",
        key: "manager",
        description: "Birim bazlı yönetim ve onay yetkileri",
        isSystem: true,
        permissions: {
            talep: ["read", "write", "delete"],
            siparis: ["read", "write"],
            teslimat: ["read", "write"],
            fatura: ["read", "write"],
            sozlesme: ["read"],
            tedarikci: ["read", "write"],
            kullanicilar: ["read"],
            ayarlar: [],
        },
    },
    {
        name: "Standart Kullanıcı",
        key: "user",
        description: "Temel okuma ve talep oluşturma yetkileri",
        isSystem: true,
        permissions: {
            talep: ["read", "write"],
            siparis: ["read"],
            teslimat: ["read"],
            fatura: [],
            sozlesme: [],
            tedarikci: [],
            kullanicilar: [],
            ayarlar: [],
        },
    },
];

async function main() {
    console.log("Seeding default roles...");

    for (const role of defaultRoles) {
        const existing = await prisma.role.findUnique({ where: { key: role.key } });
        if (existing) {
            console.log(`Role "${role.key}" already exists, updating...`);
            await prisma.role.update({
                where: { key: role.key },
                data: {
                    name: role.name,
                    description: role.description,
                    permissions: role.permissions,
                    isSystem: role.isSystem,
                },
            });
        } else {
            console.log(`Creating role "${role.key}"...`);
            await prisma.role.create({ data: role });
        }
    }

    console.log("Done!");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
