
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Listing All Roles...");
    const roles = await prisma.role.findMany();
    console.table(roles.map(r => ({
        name: r.name,
        key: r.key,
        isSystem: r.isSystem
    })));
    await prisma.$disconnect();
}

main();
