
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // 1. Promote 'cemtur@gmail.com' to Super Admin
        console.log("Promoting 'cemtur@gmail.com' to Super Admin...");
        const adminUser = await prisma.user.update({
            where: { email: "cemtur@gmail.com" },
            data: { isSuperAdmin: true }
        });
        console.log(`Updated ${adminUser.username} (isSuperAdmin: ${adminUser.isSuperAdmin})`);

        // 2. Delete 'ctur@pirireis.edu.tr'
        console.log("Deleting user 'ctur@pirireis.edu.tr'...");

        // First, find the user to get ID
        const userToDelete = await prisma.user.findUnique({
            where: { email: "ctur@pirireis.edu.tr" }
        });

        if (userToDelete) {
            // Optional: cascaded delete logic or simple delete if constraints allow
            await prisma.user.delete({
                where: { email: "ctur@pirireis.edu.tr" }
            });
            console.log(`User 'ctur@pirireis.edu.tr' deleted successfully.`);
        } else {
            console.log(`User 'ctur@pirireis.edu.tr' not found.`);
        }

    } catch (e) {
        console.error("Error updating users:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
