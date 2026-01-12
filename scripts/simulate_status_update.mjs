import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const id = 'cmk53oklf000ifdjg3e1x2pbq'; // The ID from user's trace
    const status = 'PASSIVE';

    console.log('Attempting to update RFQ:', id);

    try {
        const rfq = await prisma.rfq.update({
            where: { id },
            data: { status },
            include: {
                suppliers: {
                    select: { email: true, contactName: true, companyName: true }
                }
            }
        });
        console.log('Update Successful:', JSON.stringify(rfq, null, 2));
    } catch (e) {
        console.error('UPDATE FAILED:');
        console.error(e);
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
