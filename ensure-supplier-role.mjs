import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    const role = await prisma.role.upsert({
        where: { key: "supplier" },
        update: {},
        create: {
            key: "supplier",
            name: "Tedarikçi Hesabı",
            permissions: ["portal:view", "rfq:submit"]
        }
    });
    console.log("Supplier role ensured:", role);
}
main().catch(console.error).finally(() => prisma.$disconnect());
