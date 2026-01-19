const { PrismaClient } = require('@prisma/client');

async function listRoles() {
    const prisma = new PrismaClient();
    try {
        const roles = await prisma.role.findMany({
            select: { id: true, key: true, name: true, active: true, permissions: true }
        });

        console.log('=== MEVCUT ROLLER ===\n');
        roles.forEach(r => {
            console.log(`Rol: ${r.name}`);
            console.log(`  Key: ${r.key}`);
            console.log(`  Aktif: ${r.active ? 'Evet' : 'Hayır'}`);
            console.log(`  Yetkiler: ${JSON.stringify(r.permissions)}`);
            console.log('');
        });

        console.log(`Toplam: ${roles.length} rol`);

    } catch (error) {
        console.error('Hata:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listRoles();
