import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAdminUser() {
    console.log('🔧 Admin kullanıcısı düzeltiliyor...');

    // 1. Find the admin role
    const adminRole = await prisma.role.findUnique({
        where: { key: 'admin' }
    });

    if (!adminRole) {
        console.log('❌ Admin rolü bulunamadı!');
        await prisma.$disconnect();
        return;
    }

    console.log(`✓ Admin rolü bulundu: ${adminRole.id}`);

    // 2. Find all users that should be admin (by email or username)
    const adminUsers = await prisma.user.findMany({
        where: {
            OR: [
                { email: { contains: 'admin' } },
                { username: { contains: 'admin' } },
                { role: 'admin' }
            ]
        }
    });

    console.log(`📋 ${adminUsers.length} potansiyel admin kullanıcı bulundu.`);

    // 3. Update each user to link to admin role
    for (const user of adminUsers) {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                role: 'admin',
                roleId: adminRole.id
            }
        });
        console.log(`✓ [${user.username}] (${user.email}) -> Admin rolüne bağlandı.`);
    }

    console.log('✅ Admin kullanıcıları başarıyla güncellendi!');
    await prisma.$disconnect();
}

fixAdminUser().catch(console.error);
