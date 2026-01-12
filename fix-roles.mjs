import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const defaultRoles = [
    { key: "admin", name: "Sistem Yöneticisi", permissions: ["*"] },
    { key: "purchasing_manager", name: "Satın Alma Müdürü", permissions: ["talep:read", "siparis:manage"] },
    { key: "purchasing_specialist", name: "Satın Alma Uzmanı", permissions: ["talep:read", "siparis:create"] },
    { key: "unit_manager", name: "Birim Müdürü", permissions: ["talep:create"] },
    { key: "unit_user", name: "Birim Kullanıcısı", permissions: ["talep:create"] },
    { key: "supplier", name: "Tedarikçi", permissions: ["portal:view", "rfq:submit"] }
];

async function main() {
    console.log("Cleaning roles...");
    // We can't delete if users are linked, but let's try to update by key
    for (const r of defaultRoles) {
        await prisma.role.upsert({
            where: { key: r.key },
            update: { name: r.name, permissions: r.permissions },
            create: { key: r.key, name: r.name, permissions: r.permissions }
        });
        console.log(`Synced role: ${r.key}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
