const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPendingStatus() {
    const result = await prisma.deliveryReceipt.updateMany({
        where: { status: 'pending' },
        data: { status: 'pending_verification' }
    });
    console.log(`Updated ${result.count} records from 'pending' to 'pending_verification'`);
    await prisma.$disconnect();
}

fixPendingStatus().catch(console.error);
