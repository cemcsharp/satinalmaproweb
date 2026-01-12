import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
    const users = await prisma.user.findMany({
        include: { roleRef: true }
    });

    console.log('\n📋 KULLANICI LİSTESİ:\n');
    console.log('='.repeat(60));

    for (const u of users) {
        console.log('👤', u.username, '|', u.email);
        console.log('   Rol Alanı:', u.role);
        console.log('   RoleId:', u.roleId ? '✅ Atanmış' : '❌ YOK');

        if (u.roleRef) {
            console.log('   Rol Adı:', u.roleRef.name, '(' + u.roleRef.key + ')');
            console.log('   Yetkiler:', JSON.stringify(u.roleRef.permissions, null, 2).substring(0, 200) + '...');
        } else {
            console.log('   ⚠️  Rol bağlantısı yok!');
        }
        console.log('-'.repeat(60));
    }

    // Summary
    const withRole = users.filter(u => u.roleId).length;
    const withoutRole = users.filter(u => !u.roleId).length;

    console.log('\n📊 ÖZET:');
    console.log('   Toplam kullanıcı:', users.length);
    console.log('   Rol atanmış:', withRole, '✅');
    console.log('   Rol atanmamış:', withoutRole, withoutRole > 0 ? '⚠️' : '');

    await prisma.$disconnect();
}

checkUsers().catch(console.error);
