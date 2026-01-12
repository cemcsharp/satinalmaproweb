import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    console.log("Searching for Zoroglu...");
    const supplier = await prisma.supplier.findFirst({
        where: { name: { contains: 'Zoroglu', mode: 'insensitive' } },
        include: { users: true }
    });
    console.log("Supplier Detail:", JSON.stringify(supplier, null, 2));

    if (supplier?.email) {
        console.log(`Checking User table for email: ${supplier.email}`);
        const userByEmail = await prisma.user.findUnique({
            where: { email: supplier.email }
        });
        console.log("User by email:", JSON.stringify(userByEmail, null, 2));
    } else {
        console.log("Supplier found but has no email address.");
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
