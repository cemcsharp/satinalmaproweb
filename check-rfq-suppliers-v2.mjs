import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const rfqId = "cmk53oklf000ifdjg3e1x2pbq";
    console.log(`--- RfqSuppliers for ${rfqId} ---`);
    const invites = await prisma.rfqSupplier.findMany({
        where: { rfqId }
    });

    invites.forEach(s => console.log(`- Email: ${s.email} | Contact: ${s.contactName}`));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
