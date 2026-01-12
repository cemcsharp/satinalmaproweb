import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const id = 'cmk53oklf000ifdjg3e1x2pbq';
    const rfq = await prisma.rfq.findUnique({
        where: { id },
        include: { _count: { select: { suppliers: true } } }
    });

    if (rfq) {
        console.log('RFQ Found:', JSON.stringify(rfq, null, 2));
    } else {
        console.log('RFQ NOT FOUND:', id);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
