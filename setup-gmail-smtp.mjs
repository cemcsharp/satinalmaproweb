import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndUpdateSmtp() {
    console.log('\n📧 SMTP Ayarları Kontrolü:\n');

    const existing = await prisma.smtpSetting.findMany();

    if (existing.length > 0) {
        console.log('Mevcut ayarlar:');
        existing.forEach(s => {
            console.log('  -', s.key, '|', s.host, ':', s.port, '| User:', s.user);
        });
    } else {
        console.log('❌ Hiç SMTP ayarı bulunamadı!');
    }

    // Gmail SMTP ayarlarını ekle/güncelle
    const gmailSmtp = await prisma.smtpSetting.upsert({
        where: { key: 'gmail' },
        update: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            user: 'cemtur@gmail.com',
            pass: 'mjen zygx glwn mhhg',
            from: 'cemtur@gmail.com',
            active: true,
            isDefault: true,
            name: 'Gmail'
        },
        create: {
            key: 'gmail',
            name: 'Gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            user: 'cemtur@gmail.com',
            pass: 'mjen zygx glwn mhhg',
            from: 'cemtur@gmail.com',
            active: true,
            isDefault: true
        }
    });

    console.log('\n✅ Gmail SMTP ayarları güncellendi:');
    console.log('   Host:', gmailSmtp.host);
    console.log('   Port:', gmailSmtp.port);
    console.log('   User:', gmailSmtp.user);
    console.log('   From:', gmailSmtp.from);
    console.log('   Default:', gmailSmtp.isDefault);

    await prisma.$disconnect();
}

checkAndUpdateSmtp().catch(console.error);
