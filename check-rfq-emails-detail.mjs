import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRfqEmails() {
    console.log('\n📧 RFQ Email Kontrolü:\n');

    // Check RFQ invite emails
    const rfqEmails = await prisma.emailLog.findMany({
        where: { category: 'rfq_invite' },
        orderBy: { createdAt: 'desc' },
        take: 20
    });

    console.log(`RFQ Invite Emails: ${rfqEmails.length}`);
    if (rfqEmails.length === 0) {
        console.log('❌ Hiç RFQ davet emaili gönderilmemiş!\n');
    } else {
        rfqEmails.forEach(log => {
            const status = log.status === 'sent' ? '✅' : '❌';
            console.log(`${status} ${log.to} | ${log.status} | ${log.lastError || 'OK'}`);
        });
    }

    // Check all emails
    console.log('\n📋 Tüm Email Logları (son 10):\n');
    const allEmails = await prisma.emailLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    allEmails.forEach(log => {
        console.log(`${log.status.padEnd(8)} | ${log.category?.padEnd(15) || 'general'.padEnd(15)} | ${log.to}`);
    });

    // Check RFQs with suppliers
    console.log('\n📦 Son RFQ\'lar ve Tedarikçiler:\n');
    const rfqs = await prisma.rfq.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
            suppliers: { select: { email: true, stage: true } }
        }
    });

    rfqs.forEach(rfq => {
        console.log(`${rfq.rfxCode} | ${rfq.status} | ${rfq.suppliers.length} tedarikçi`);
        rfq.suppliers.forEach(s => console.log(`   - ${s.email} (${s.stage})`));
    });

    await prisma.$disconnect();
}

checkRfqEmails().catch(console.error);
