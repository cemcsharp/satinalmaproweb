import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    console.log("Listing users with role 'supplier'...");
    const users = await prisma.user.findMany({
        where: { role: 'supplier' }
    });
    console.log("Supplier Users:", JSON.stringify(users, null, 2));

    const allUsers = await prisma.user.findMany({
        take: 10,
        select: { email: true, role: true }
    });
    console.log("Recent Users (sample):", JSON.stringify(allUsers, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
