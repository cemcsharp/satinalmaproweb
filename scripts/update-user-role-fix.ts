import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = "ctur@pirireis.edu.tr";

    console.log(`Checking user: ${email}...`);

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.error(`User found not found: ${email}`);
        process.exit(1);
    }

    console.log(`Current Role: ${user.role}`);

    // UPGRADE TO SATINALMA MUDURU or ADMIN based on request
    // The user said "satinalma mudurluguna bağlı". 
    // "satinalma_muduru" seems appropriate based on permissions.ts having full access.
    const newRole = "satinalma_muduru";

    const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
            role: newRole,
            // Clear legacy roleId if it conflicts, or just leave it. Schema says User has role string.
        }
    });

    console.log(`Updated user ${email} to role: ${updated.role}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
