import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignRoles() {
    console.log('\n🔐 Mevcut Roller:\n');

    const roles = await prisma.role.findMany();
    roles.forEach(r => console.log('  -', r.key, ':', r.name));

    // Create missing roles if needed
    const rolesToCreate = [
        {
            key: 'birim_yetkilisi',
            name: 'Birim Yetkilisi',
            description: 'Birim bazlı işlemleri yönetebilen kullanıcı',
            permissions: {
                talep: ['read', 'create', 'edit'],
                siparis: ['read'],
                fatura: ['read'],
                sozlesme: ['read'],
                tedarikci: ['read'],
                rapor: ['read']
            }
        },
        {
            key: 'satinalma_muduru',
            name: 'Satınalma Müdürü',
            description: 'Satınalma süreçlerinin tamamını yönetebilen kullanıcı',
            permissions: {
                talep: ['read', 'create', 'edit', 'delete'],
                siparis: ['read', 'create', 'edit', 'delete'],
                rfq: ['read', 'create', 'edit', 'delete'],
                fatura: ['read', 'create', 'edit'],
                sozlesme: ['read', 'create', 'edit'],
                tedarikci: ['read', 'create', 'edit'],
                evaluation: ['submit'],
                rapor: ['read'],
                ayarlar: ['read']
            }
        }
    ];

    console.log('\n📝 Eksik rolleri oluşturuyorum...\n');

    for (const roleData of rolesToCreate) {
        const existing = await prisma.role.findUnique({ where: { key: roleData.key } });
        if (!existing) {
            await prisma.role.create({ data: roleData });
            console.log('  ✅ Oluşturuldu:', roleData.name);
        } else {
            console.log('  ℹ️  Zaten mevcut:', roleData.name);
        }
    }

    // Assign roles to users without roleId
    console.log('\n👤 Kullanıcılara roller atanıyor...\n');

    const usersWithoutRole = await prisma.user.findMany({
        where: { roleId: null }
    });

    for (const user of usersWithoutRole) {
        const role = await prisma.role.findFirst({
            where: { key: user.role }
        });

        if (role) {
            await prisma.user.update({
                where: { id: user.id },
                data: { roleId: role.id }
            });
            console.log('  ✅', user.username, '->', role.name);
        } else {
            // Fallback to 'user' role
            const userRole = await prisma.role.findFirst({ where: { key: 'user' } });
            if (userRole) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { roleId: userRole.id, role: 'user' }
                });
                console.log('  ⚠️', user.username, '-> Kullanıcı (fallback)');
            }
        }
    }

    console.log('\n✅ Tamamlandı!\n');

    await prisma.$disconnect();
}

assignRoles().catch(console.error);
