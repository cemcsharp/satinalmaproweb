
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: { username: true, role: true, roleId: true }
    });

    console.log("--- RoleId Usage Check ---");
    const usersWithRoleId = users.filter(u => u.roleId !== null);
    if (usersWithRoleId.length > 0) {
        console.log(`Found ${usersWithRoleId.length} users with legacy 'roleId'.`);
        console.log(usersWithRoleId);
    } else {
        console.log("No users have 'roleId' set. Safe to delete column.");
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
