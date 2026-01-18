import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupOldRoles() {
    console.log('🧹 Eski roller temizleniyor...');

    const oldKeys = ['procurement_manager', 'finance_manager', 'buyer', 'requester', 'supplier'];

    for (const key of oldKeys) {
        try {
            await prisma.role.delete({ where: { key } });
            console.log(`✓ Silindi: ${key}`);
        } catch (e) {
            console.log(`- Bulunamadı veya atlandı: ${key}`);
        }
    }

    console.log('✅ Temizlik tamamlandı.');
    await prisma.$disconnect();
}

cleanupOldRoles().catch(console.error);
