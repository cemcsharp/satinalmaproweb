import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create default roles with permissions
 */
async function seedRoles() {
    console.log('🔐 Creating default roles...');

    // Admin Role - Full permissions
    const adminRole = await prisma.role.upsert({
        where: { key: 'admin' },
        update: {},
        create: {
            key: 'admin',
            name: 'Yönetici',
            description: 'Tüm sistem yetkilerine sahip kullanıcı',
            isSystem: true,
            permissions: {
                talep: ['read', 'create', 'edit', 'delete'],
                siparis: ['read', 'create', 'edit', 'delete'],
                fatura: ['read', 'create', 'edit', 'delete'],
                sozlesme: ['read', 'create', 'edit', 'delete'],
                tedarikci: ['read', 'create', 'edit', 'delete'],
                evaluation: ['submit'],
                rapor: ['read'],
                ayarlar: ['read', 'edit'],
                user: ['manage'],
                role: ['manage']
            }
        }
    });

    // Manager Role - Limited permissions
    const managerRole = await prisma.role.upsert({
        where: { key: 'manager' },
        update: {},
        create: {
            key: 'manager',
            name: 'Müdür',
            description: 'Satınalma süreçlerini yönetebilen kullanıcı',
            isSystem: true,
            permissions: {
                talep: ['read', 'create', 'edit'],
                siparis: ['read', 'create', 'edit'],
                fatura: ['read', 'create'],
                sozlesme: ['read', 'create'],
                tedarikci: ['read', 'edit'],
                evaluation: ['submit'],
                rapor: ['read']
            }
        }
    });

    // User Role - Basic permissions
    const userRole = await prisma.role.upsert({
        where: { key: 'user' },
        update: {},
        create: {
            key: 'user',
            name: 'Kullanıcı',
            description: 'Temel satınalma işlemlerini yapabilen kullanıcı',
            isSystem: true,
            permissions: {
                talep: ['read', 'create'],
                siparis: ['read'],
                fatura: ['read'],
                sozlesme: ['read'],
                tedarikci: ['read'],
                rapor: ['read']
            }
        }
    });

    console.log(`✅ Created role: ${adminRole.name} (${adminRole.key})`);
    console.log(`✅ Created role: ${managerRole.name} (${managerRole.key})`);
    console.log(`✅ Created role: ${userRole.name} (${userRole.key})`);

    // Assign roles to users
    console.log('\n👤 Assigning roles to users...');

    // Admins
    const adminEmails = ['admin@sirket.com', 'admin@satinalmapro.com'];
    for (const email of adminEmails) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    role: 'admin',
                    roleId: adminRole.id
                }
            });
            console.log(`✅ Assigned admin role to: ${email}`);
        }
    }

    // All other users -> user role
    const regularUsers = await prisma.user.findMany({
        where: {
            email: { notIn: adminEmails },
            roleId: null
        }
    });

    for (const user of regularUsers) {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                role: 'user',
                roleId: userRole.id
            }
        });
        console.log(`✅ Assigned user role to: ${user.username}`);
    }

    console.log('\n🎉 Role seeding completed!');
}

seedRoles()
    .catch((e) => {
        console.error('❌ Error seeding roles:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
