import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    const rfqs = await prisma.rfq.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { rfxCode: true, title: true, createdAt: true }
    });
    console.log(JSON.stringify(rfqs, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
