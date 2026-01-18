import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
    const users = await prisma.user.findMany({
        select: {
            email: true,
            username: true,
            role: true,
            roleRef: { select: { key: true, name: true } }
        },
        take: 10
    });

    console.log('\n📋 Mevcut Kullanıcılar:\n');
    console.log('E-posta'.padEnd(30) + ' | ' + 'Kullanıcı Adı'.padEnd(20) + ' | ' + 'Rol');
    console.log('='.repeat(80));

    users.forEach(u => {
        const role = u.roleRef?.name || u.role || 'Belirtilmemiş';
        console.log(
            (u.email || '-').padEnd(30) + ' | ' +
            (u.username || '-').padEnd(20) + ' | ' +
            role
        );
    });

    await prisma.$disconnect();
}

listUsers();
