import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const rfqId = "cmk53oidf000ifdjg3c1x2pbq";
    console.log(`--- RfqSuppliers for ${rfqId} ---`);
    const invites = await prisma.rfqSupplier.findMany({
        where: { rfqId }
    });

    console.log(JSON.stringify(invites, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
