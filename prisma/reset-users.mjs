import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetUsers() {
    console.log('🔄 Kullanıcı Sıfırlama İşlemi...\n');

    try {
        // Get admin role
        const adminRole = await prisma.role.findUnique({ where: { key: 'admin' } });

        if (!adminRole) {
            console.log('❌ Admin rolü bulunamadı!');
            return;
        }

        // Find the user to keep
        const keepUser = await prisma.user.findFirst({
            where: { email: 'cemtur@gmail.com' }
        });

        if (!keepUser) {
            console.log('❌ cemtur@gmail.com kullanıcısı bulunamadı!');
            return;
        }

        console.log(`✅ Korunacak kullanıcı bulundu: ${keepUser.email}`);

        // Get all other users
        const usersToDelete = await prisma.user.findMany({
            where: {
                NOT: { email: 'cemtur@gmail.com' }
            },
            select: { id: true, email: true }
        });

        console.log(`\n📋 Silinecek kullanıcılar (${usersToDelete.length} adet):`);
        usersToDelete.forEach(u => console.log(`   - ${u.email}`));

        // Delete other users
        const deleteResult = await prisma.user.deleteMany({
            where: {
                NOT: { email: 'cemtur@gmail.com' }
            }
        });

        console.log(`\n✅ ${deleteResult.count} kullanıcı silindi.`);

        // Update cemtur@gmail.com to admin
        await prisma.user.update({
            where: { id: keepUser.id },
            data: {
                role: 'admin',
                roleId: adminRole.id,
                username: 'Sistem Admin'
            }
        });

        console.log('✅ cemtur@gmail.com → Sistem Admin olarak güncellendi.');

        // Final state
        console.log('\n📋 Güncel Kullanıcı Durumu:');
        const allUsers = await prisma.user.findMany({
            select: { email: true, username: true, roleRef: { select: { name: true } } }
        });

        allUsers.forEach(u => {
            console.log(`   ✅ ${u.email} | ${u.username} | ${u.roleRef?.name}`);
        });

    } catch (e) {
        console.error('❌ Hata:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

resetUsers();
