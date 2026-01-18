import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('RFQ durumlarını güncelliyorum...');

    // ACTIVE olanları OPEN yap
    const result = await prisma.rfq.updateMany({
        where: { status: 'ACTIVE' },
        data: { status: 'OPEN' }
    });

    console.log(`${result.count} RFQ durumu OPEN olarak güncellendi`);

    // Deadline'ları kontrol et
    const rfqs = await prisma.rfq.findMany({
        where: { status: 'OPEN' },
        select: { id: true, title: true, deadline: true }
    });

    console.log('\nGüncel RFQ\'lar:');
    for (const rfq of rfqs) {
        console.log(`  - ${rfq.title} (Deadline: ${rfq.deadline})`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
