
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: {
            unit: true
        },
        orderBy: {
            username: 'asc'
        }
    });

    console.log(JSON.stringify(users.map(u => ({
        username: u.username,
        email: u.email,
        role: u.role,
        unit: u.unit?.label || null
    })), null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
