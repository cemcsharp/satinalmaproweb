import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignAdmin() {
    const email = 'ctur@pirireis.edu.tr';
    console.log(`🔑 Admin rolü atanıyor: ${email}...`);

    const adminRole = await prisma.role.findUnique({
        where: { key: 'admin' }
    });

    if (!adminRole) {
        console.error('❌ Admin rolü bulunamadı! Önce seed-roles-v2.mjs çalıştırılmalı.');
        process.exit(1);
    }

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.log(`⚠ Kullanıcı bulunamadı: ${email}. Rastgele bir kullanıcı seçiliyor...`);
        const firstUser = await prisma.user.findFirst();
        if (firstUser) {
            await prisma.user.update({
                where: { id: firstUser.id },
                data: {
                    roleId: adminRole.id,
                    role: 'admin'
                }
            });
            console.log(`✅ [${firstUser.username}] kullanıcısına Admin rolü atandı.`);
        } else {
            console.error('❌ Hiç kullanıcı bulunamadı!');
        }
    } else {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                roleId: adminRole.id,
                role: 'admin'
            }
        });
        console.log(`✅ [${email}] kullanıcısına Admin rolü atandı.`);
    }

    await prisma.$disconnect();
}

assignAdmin().catch(console.error);
