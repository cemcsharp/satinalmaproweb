const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUser() {
    const email = 'ctur@pirireis.edu.tr';

    // Find user
    const user = await prisma.user.findUnique({
        where: { email },
        include: { tenant: true }
    });

    if (!user) {
        console.log('Kullanıcı bulunamadı');
        return;
    }

    // Role ID for buyer_admin
    const buyerAdminRole = await prisma.role.findFirst({
        where: { key: 'buyer_admin' }
    });

    if (!buyerAdminRole) {
        console.log('buyer_admin rolü bulunamadı');
        return;
    }

    // Update Tenant
    await prisma.tenant.update({
        where: { id: user.tenantId },
        data: {
            isBuyer: true,
            isSupplier: false,
            isActive: true,
            registrationStatus: 'approved'
        }
    });

    // Update User
    await prisma.user.update({
        where: { id: user.id },
        data: {
            roleId: buyerAdminRole.id,
            isActive: true
        }
    });

    console.log(`Kullanıcı ${email} başarıyla ALICI (Buyer) olarak güncellendi ve buyer_admin rolü atandı.`);
}

fixUser()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
