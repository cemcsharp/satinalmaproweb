const { PrismaClient } = require('@prisma/client');

async function deleteUser() {
    const prisma = new PrismaClient();
    try {
        const email = 'ctur@pirireis.edu.tr';

        // Find user first
        const user = await prisma.user.findUnique({
            where: { email },
            include: { tenant: true }
        });

        if (!user) {
            console.log('Kullanıcı bulunamadı:', email);
            return;
        }

        console.log('Silinecek kullanıcı:', user.email);
        console.log('Bağlı tenant:', user.tenant?.name || 'Yok');

        // Delete user first
        await prisma.user.delete({
            where: { id: user.id }
        });
        console.log('✅ Kullanıcı silindi');

        // Delete tenant if exists
        if (user.tenantId) {
            await prisma.tenant.delete({
                where: { id: user.tenantId }
            });
            console.log('✅ Tenant silindi');
        }

        console.log('\n✅ Tüm kayıtlar başarıyla silindi!');

    } catch (error) {
        console.error('Hata:', error);
    } finally {
        await prisma.$disconnect();
    }
}

deleteUser();
