import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('📊 Verifying data status...');

    const counts = await Promise.all([
        prisma.request.count(),
        prisma.order.count(),
        prisma.rfq.count(),
        prisma.invoice.count(),
        prisma.contract.count(),
        prisma.auditLog.count(),
        prisma.notification.count(),
    ]);

    const labels = ['Requests', 'Orders', 'RFQs', 'Invoices', 'Contracts', 'Audit Logs', 'Notifications'];

    counts.forEach((count, i) => {
        console.log(`${labels[i]}: ${count}`);
    });

    const total = counts.reduce((a, b) => a + b, 0);
    if (total === 0) {
        console.log('✅ All business data is cleared.');
    } else {
        console.log('⚠️ Some business data still remains.');
    }

    await prisma.$disconnect();
}

main();
