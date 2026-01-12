import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEmailLogs() {
    console.log('\n📧 Email Log Kontrolü:\n');

    const logs = await prisma.emailLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20
    });

    if (logs.length === 0) {
        console.log('❌ Hiç email logu bulunamadı!');
    } else {
        console.log(`Toplam ${logs.length} email logu:\n`);
        logs.forEach(log => {
            const status = log.status === 'sent' ? '✅' : log.status === 'failed' ? '❌' : '⏳';
            console.log(`${status} ${log.createdAt.toISOString().slice(0, 16)} | ${log.status.padEnd(8)} | ${log.to}`);
            console.log(`   Konu: ${log.subject?.substring(0, 60)}...`);
            if (log.lastError) console.log(`   Hata: ${log.lastError}`);
            console.log('');
        });
    }

    await prisma.$disconnect();
}

checkEmailLogs().catch(console.error);
