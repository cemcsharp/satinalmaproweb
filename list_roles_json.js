
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Listing All Roles Json...");
    const roles = await prisma.role.findMany();
    console.log(JSON.stringify(roles.map(r => ({
        name: r.name,
        key: r.key,
        isSystem: r.isSystem
    })), null, 2));
    await prisma.$disconnect();
}

main();
