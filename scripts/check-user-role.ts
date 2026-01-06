import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = "ctur@pirireis.edu.tr";
    const user = await prisma.user.findUnique({
        where: { email },
        include: { roleRef: true }
    });

    console.log("User:", user?.email);
    console.log("Role String:", user?.role);
    console.log("RoleId:", user?.roleId);
    console.log("RoleRef:", user?.roleRef?.name);
    console.log("RoleRef Permissions:", JSON.stringify(user?.roleRef?.permissions, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
