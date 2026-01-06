import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixUserRole() {
    // Get the user
    const user = await prisma.user.findUnique({
        where: { email: 'ctur@pirireis.edu.tr' },
        include: { roleRef: true }
    });

    if (!user) {
        console.log('❌ Kullanıcı bulunamadı');
        return;
    }

    console.log('📋 MEVCUT DURUM:');
    console.log('Rol (string):', user.role);
    console.log('Rol ID:', user.roleId);
    console.log('RoleRef Key:', user.roleRef?.key);
    console.log('');

    // Sync the role string with roleRef key
    if (user.roleRef) {
        await prisma.user.update({
            where: { id: user.id },
            data: { role: user.roleRef.key }
        });
        console.log('✅ Rol string güncellendi:', user.roleRef.key);
    } else {
        console.log('⚠️ RoleRef yok, güncelleme yapılamadı');
    }

    // Verify
    const updated = await prisma.user.findUnique({
        where: { email: 'ctur@pirireis.edu.tr' },
        include: { roleRef: true }
    });

    console.log('');
    console.log('📋 GÜNCEL DURUM:');
    console.log('Rol (string):', updated?.role);
    console.log('Rol ID:', updated?.roleId);
    console.log('RoleRef Key:', updated?.roleRef?.key);

    await prisma.$disconnect();
}

fixUserRole().catch(e => {
    console.error(e);
    process.exit(1);
});
