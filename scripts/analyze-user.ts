import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function analyzeUser() {
    const user = await prisma.user.findUnique({
        where: { email: 'ctur@pirireis.edu.tr' },
        include: { roleRef: true, unit: true }
    });

    if (!user) {
        console.log('❌ Kullanıcı bulunamadı');
        return;
    }

    console.log('📋 KULLANICI ANALİZİ');
    console.log('='.repeat(50));
    console.log('ID:', user.id);
    console.log('Kullanıcı Adı:', user.username);
    console.log('E-posta:', user.email);
    console.log('Rol (string):', user.role);
    console.log('Rol ID:', user.roleId || 'Yok');
    console.log('Birim:', user.unit?.label || 'Atanmamış');
    console.log('Birim ID:', user.unitId || 'Yok');
    console.log('');

    if (user.roleRef) {
        console.log('📌 ROL DETAYLARI');
        console.log('-'.repeat(50));
        console.log('Rol Adı:', user.roleRef.name);
        console.log('Rol Key:', user.roleRef.key);
        console.log('Sistem Rolü:', user.roleRef.isSystem ? 'Evet' : 'Hayır');
        console.log('');
        console.log('📑 İZİNLER:');
        const perms = user.roleRef.permissions as string[] || [];
        if (Array.isArray(perms)) {
            perms.forEach(p => console.log('  ✓', p));
        }
    } else {
        console.log('⚠️  Rol referansı (roleRef) yok - sadece string rol kullanılıyor');
    }

    await prisma.$disconnect();
}

analyzeUser().catch(e => {
    console.error(e);
    process.exit(1);
});
