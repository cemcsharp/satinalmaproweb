import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupRoles() {
    console.log('🧹 Sistem Temizliği Başlıyor...\n');

    try {
        // 1. Eski "manager" rolünü sil
        const managerRole = await prisma.role.findUnique({ where: { key: 'manager' } });

        if (managerRole) {
            // Önce bu role bağlı kullanıcıları kontrol et
            const usersWithRole = await prisma.user.count({ where: { roleId: managerRole.id } });

            if (usersWithRole > 0) {
                console.log(`⚠️ "${managerRole.name}" rolüne ${usersWithRole} kullanıcı bağlı.`);
                console.log('   Önce bu kullanıcıları başka role taşıyın.');
            } else {
                await prisma.role.delete({ where: { key: 'manager' } });
                console.log('✅ Eski "Müdür" (manager) rolü silindi.');
            }
        } else {
            console.log('ℹ️ "manager" rolü zaten mevcut değil.');
        }

        // 2. Mevcut rolleri listele
        console.log('\n📋 Güncel Rol Listesi:');
        const roles = await prisma.role.findMany({
            select: { key: true, name: true, _count: { select: { users: true } } },
            orderBy: { key: 'asc' }
        });

        roles.forEach(r => {
            console.log(`   - ${r.key.padEnd(20)}: ${r.name.padEnd(25)} (${r._count.users} kullanıcı)`);
        });

        // 3. Kullanıcı-Rol eşleşmesi kontrolü
        console.log('\n👥 Kullanıcı Rol Atama Durumu:');
        const users = await prisma.user.findMany({
            select: { email: true, role: true, roleRef: { select: { key: true, name: true } } }
        });

        users.forEach(u => {
            const roleStatus = u.roleRef ? '✅' : '⚠️';
            const roleName = u.roleRef?.name || u.role || 'Atanmamış';
            console.log(`   ${roleStatus} ${(u.email || '-').padEnd(30)}: ${roleName}`);
        });

    } catch (e) {
        console.error('❌ Hata:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupRoles();
