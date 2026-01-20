
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const token = "a74dccd522b5598fc3afb2e130cfc0e6cfe53d3dc1cbe5c05607418beac43694";
    console.log("Checking token:", token);

    const invite = await prisma.invitation.findUnique({
        where: { token }
    });

    if (!invite) {
        console.log("❌ Invitation NOT FOUND");
    } else {
        console.log("✅ Invitation FOUND");
        console.log("Status:", invite.status);
        console.log("ExpiresAt:", invite.expiresAt);
        console.log("Current Time:", new Date());
        console.log("Is Pending?", invite.status === 'pending');
        console.log("Is Expired?", invite.expiresAt < new Date());
    }

    await prisma.$disconnect();
}

main();
