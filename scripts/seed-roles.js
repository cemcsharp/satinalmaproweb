const { PrismaClient } = require('@prisma/client');

async function seedDefaultRoles() {
    const prisma = new PrismaClient();

    const defaultRoles = [
        {
            key: 'buyer_admin',
            name: 'Alıcı Firma Yöneticisi',
            description: 'Alıcı firma sahibi/yöneticisi - Tüm alıcı işlemlerine erişim',
            permissions: [
                'talep:create', 'talep:read', 'talep:edit', 'talep:delete', 'talep:approve',
                'siparis:create', 'siparis:read', 'siparis:edit',
                'rfq:create', 'rfq:read', 'rfq:edit', 'rfq:finalize',
                'tedarikci:read', 'tedarikci:evaluate',
                'rapor:read',
                'kullanici:read', 'kullanici:create', 'kullanici:edit'
            ],
            isSystem: true,
            active: true,
            sortOrder: 10
        },
        {
            key: 'buyer_user',
            name: 'Alıcı Çalışanı',
            description: 'Alıcı firma çalışanı - Temel alıcı işlemlerine erişim',
            permissions: [
                'talep:create', 'talep:read',
                'siparis:read',
                'rfq:read',
                'tedarikci:read'
            ],
            isSystem: true,
            active: true,
            sortOrder: 11
        },
        {
            key: 'supplier_admin',
            name: 'Tedarikçi Yöneticisi',
            description: 'Tedarikçi firma sahibi/yöneticisi - Tüm tedarikçi işlemlerine erişim',
            permissions: [
                'portal:access',
                'rfq:view', 'rfq:offer',
                'order:view',
                'profile:read', 'profile:edit',
                'kullanici:read', 'kullanici:create', 'kullanici:edit'
            ],
            isSystem: true,
            active: true,
            sortOrder: 20
        },
        {
            key: 'supplier_user',
            name: 'Tedarikçi Çalışanı',
            description: 'Tedarikçi firma çalışanı - Temel tedarikçi işlemlerine erişim',
            permissions: [
                'portal:access',
                'rfq:view', 'rfq:offer',
                'order:view',
                'profile:read'
            ],
            isSystem: true,
            active: true,
            sortOrder: 21
        }
    ];

    try {
        console.log('Varsayılan roller oluşturuluyor...\n');

        for (const roleData of defaultRoles) {
            // Check if role exists
            const existing = await prisma.role.findFirst({
                where: { key: roleData.key }
            });

            if (existing) {
                console.log(`⏭️  ${roleData.name} (${roleData.key}) zaten var, güncelleniyor...`);
                await prisma.role.update({
                    where: { id: existing.id },
                    data: {
                        name: roleData.name,
                        description: roleData.description,
                        permissions: roleData.permissions,
                        active: roleData.active
                    }
                });
            } else {
                console.log(`✅ ${roleData.name} (${roleData.key}) oluşturuluyor...`);
                await prisma.role.create({
                    data: roleData
                });
            }
        }

        console.log('\n✅ Tüm varsayılan roller hazır!');

        // List all roles
        const allRoles = await prisma.role.findMany({
            select: { key: true, name: true, active: true },
            orderBy: { sortOrder: 'asc' }
        });

        console.log('\n=== TÜM ROLLER ===');
        allRoles.forEach(r => {
            console.log(`  ${r.active ? '🟢' : '⚪'} ${r.key}: ${r.name}`);
        });

    } catch (error) {
        console.error('Hata:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedDefaultRoles();
