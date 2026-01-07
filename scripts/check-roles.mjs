import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkRoles() {
    const roles = await prisma.role.findMany();
    console.log("Current Roles in DB:");
    roles.forEach(r => {
        console.log(`- ${r.key}: ${JSON.stringify(r.permissions)}`);
    });

    const user = await prisma.user.findUnique({
        where: { username: "admin" }, // Check a known user
        include: { roleRef: true }
    });
    console.log("\nSample User (admin):");
    console.log(`- Username: ${user?.username}`);
    console.log(`- Role Key: ${user?.roleRef?.key || user?.role}`);
    console.log(`- Permissions: ${JSON.stringify(user?.roleRef?.permissions)}`);

    await prisma.$disconnect();
}

checkRoles();
