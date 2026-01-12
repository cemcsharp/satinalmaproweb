import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const rfqs = await prisma.rfq.findMany({
        select: { id: true, rfxCode: true },
        orderBy: { createdAt: "desc" }
    });
    console.log(JSON.stringify(rfqs, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
