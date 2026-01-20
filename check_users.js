
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({
            select: {
                username: true,
                email: true,
                isSuperAdmin: true,
                roleRef: {
                    select: {
                        name: true
                    }
                }
            }
        });

        if (users.length === 0) {
            console.log("No users found in the database.");
        } else {
            console.log("Current System Users:");
            users.forEach(u => {
                console.log(`- Username: ${u.username}, Email: ${u.email}, Role: ${u.role}, SuperAdmin: ${u.isSuperAdmin}`);
            });
        }
    } catch (e) {
        console.error("Error retrieving users:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
