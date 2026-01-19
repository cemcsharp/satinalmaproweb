const { PrismaClient } = require('@prisma/client');

async function checkUser() {
    const prisma = new PrismaClient();
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'ctur@pirireis.edu.tr' },
            include: {
                tenant: true,
                roleRef: true
            }
        });

        if (user) {
            console.log('=== KULLANICI BİLGİLERİ ===');
            console.log('ID:', user.id);
            console.log('Email:', user.email);
            console.log('Username:', user.username);
            console.log('Aktif mi:', user.isActive);
            console.log('Super Admin:', user.isSuperAdmin);
            console.log('');

            if (user.roleRef) {
                console.log('=== ROL BİLGİLERİ ===');
                console.log('Rol Adı:', user.roleRef.name);
                console.log('Rol Key:', user.roleRef.key);
                console.log('Yetkileri:', JSON.stringify(user.roleRef.permissions, null, 2));
            } else {
                console.log('Rol atanmamış!');
            }

            console.log('');
            if (user.tenant) {
                console.log('=== TENANT BİLGİLERİ ===');
                console.log('Tenant ID:', user.tenant.id);
                console.log('Tenant Adı:', user.tenant.name);
                console.log('Alıcı mı (isBuyer):', user.tenant.isBuyer);
                console.log('Tedarikçi mi (isSupplier):', user.tenant.isSupplier);
                console.log('Aktif mi:', user.tenant.isActive);
                console.log('Kayıt Durumu:', user.tenant.registrationStatus);
            } else {
                console.log('Tenant bağlı değil!');
            }
        } else {
            console.log('Kullanıcı bulunamadı: ctur@pirireis.edu.tr');
        }
    } catch (error) {
        console.error('Hata:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
