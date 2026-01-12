import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateSmtpFrom() {
    await prisma.smtpSetting.update({
        where: { key: 'gmail' },
        data: { from: 'SatınalmaPRO - Online Satınalma Platformu <cemtur@gmail.com>' }
    });

    console.log('✅ Gönderici adı güncellendi!');
    console.log('   Yeni: SatınalmaPRO - Online Satınalma Platformu <cemtur@gmail.com>');

    await prisma.$disconnect();
}

updateSmtpFrom().catch(console.error);
