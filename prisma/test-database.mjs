import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabase() {
    console.log('📊 Veritabanı Test Raporu\n');

    try {
        const counts = {
            users: await prisma.user.count(),
            roles: await prisma.role.count(),
            requests: await prisma.request.count(),
            rfqs: await prisma.rfq.count(),
            orders: await prisma.order.count(),
            suppliers: await prisma.supplier.count(),
            invoices: await prisma.invoice.count().catch(() => 'N/A'),
            contracts: await prisma.contract.count().catch(() => 'N/A'),
            departments: await prisma.department.count().catch(() => 'N/A'),
            budgets: await prisma.budget.count().catch(() => 'N/A')
        };

        console.log('Tablo Kayıt Sayıları:');
        console.log('=====================');
        Object.entries(counts).forEach(([table, count]) => {
            const status = typeof count === 'number' && count > 0 ? '✅' : '⚠️';
            console.log(`${status} ${table.padEnd(15)}: ${count}`);
        });

        // Test specific role check
        console.log('\n🔐 Rol Kontrolü:');
        const roles = await prisma.role.findMany({ select: { key: true, name: true } });
        roles.forEach(r => console.log(`   - ${r.key}: ${r.name}`));

        // Admin user check
        console.log('\n👤 Admin Kullanıcı Kontrolü:');
        const adminUser = await prisma.user.findFirst({
            where: { role: 'admin' },
            include: { roleRef: true }
        });
        if (adminUser) {
            console.log(`   ✅ Admin bulundu: ${adminUser.email}`);
            console.log(`   Rol Key: ${adminUser.roleRef?.key || adminUser.role}`);
        } else {
            console.log('   ❌ Admin kullanıcı bulunamadı!');
        }

    } catch (e) {
        console.error('❌ Hata:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

testDatabase();
