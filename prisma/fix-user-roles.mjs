import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUserRoles() {
    console.log('🔧 Kullanıcı Rol Düzeltmesi...\n');

    try {
        // Get talep_sahibi role for regular users
        const talepSahibiRole = await prisma.role.findUnique({ where: { key: 'talep_sahibi' } });

        if (!talepSahibiRole) {
            console.log('❌ talep_sahibi rolü bulunamadı!');
            return;
        }

        // Find users with legacy 'user' role (no roleRef)
        const usersToFix = await prisma.user.findMany({
            where: {
                roleRef: null,
                role: 'user'
            }
        });

        console.log(`📋 Düzeltilecek kullanıcı sayısı: ${usersToFix.length}\n`);

        for (const user of usersToFix) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    role: 'talep_sahibi',
                    roleId: talepSahibiRole.id
                }
            });
            console.log(`   ✅ ${user.email} → Talep Sahibi`);
        }

        console.log('\n✅ Tüm kullanıcılar güncellendi!');

        // Final user list
        console.log('\n📋 Güncel Kullanıcı Durumu:');
        const allUsers = await prisma.user.findMany({
            select: { email: true, roleRef: { select: { name: true } } }
        });

        allUsers.forEach(u => {
            console.log(`   - ${(u.email || '-').padEnd(30)}: ${u.roleRef?.name || 'Atanmamış'}`);
        });

    } catch (e) {
        console.error('❌ Hata:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

fixUserRoles();
