import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Duplicate/old role keys to remove (keeping the new ones from seed-roles.ts)
const keysToRemove = [
    "satinalma_muduru",     // duplicate of purchasing_manager
    "satinalma_uzmani",     // duplicate of purchasing_specialist  
    "manager",              // old generic role
    "yonetici",             // old role
];

async function cleanupRoles() {
    console.log("🧹 Cleaning up duplicate roles...\n");

    for (const key of keysToRemove) {
        const role = await prisma.role.findUnique({ where: { key } });

        if (role) {
            // Check if any users are assigned to this role
            const userCount = await prisma.user.count({ where: { roleId: role.id } });

            if (userCount > 0) {
                console.log(`⚠️  Skipping ${key} - has ${userCount} users assigned`);
            } else {
                await prisma.role.delete({ where: { key } });
                console.log(`✅ Deleted: ${role.name} (${key})`);
            }
        } else {
            console.log(`⏭️  Not found: ${key}`);
        }
    }

    console.log("\n✅ Cleanup completed!");

    // Show remaining roles
    const remaining = await prisma.role.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" }
    });
    console.log("\n📋 Remaining roles:");
    remaining.forEach(r => console.log(`   - ${r.name} (${r.key})`));
}

cleanupRoles()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error("❌ Error:", e);
        prisma.$disconnect();
        process.exit(1);
    });
