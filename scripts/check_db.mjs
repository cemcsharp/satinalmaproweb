import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const counts = await prisma.supplier.groupBy({
        by: ['registrationStatus'],
        _count: { id: true }
    });
    console.log("Supplier counts by status:", JSON.stringify(counts, null, 2));

    const recent = await prisma.supplier.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
            id: true,
            name: true,
            registrationStatus: true,
            createdAt: true
        }
    });
    console.log("Recent suppliers:", JSON.stringify(recent, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
