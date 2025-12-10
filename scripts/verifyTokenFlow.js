
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function main() {
    try {
        console.log("1. Finding an order...");
        const order = await prisma.order.findFirst();
        if (!order) {
            console.log("No order found. Cannot test.");
            return;
        }
        console.log("Order found:", order.id);

        console.log("2. Creating Token...");
        const tokenStr = "TEST-" + crypto.randomBytes(4).toString("hex").toUpperCase();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const created = await prisma.deliveryToken.create({
            data: {
                token: tokenStr,
                orderId: order.id,
                expiresAt
            }
        });
        console.log("Token created in DB:", created);

        console.log("3. Verifying Token Lookup...");
        const found = await prisma.deliveryToken.findUnique({
            where: { token: tokenStr },
            include: { order: true }
        });

        if (found) {
            console.log("Token verified successfully!");
            console.log("Linked Order:", found.order.id);
        } else {
            console.error("CRITICAL: Token created but cannot be found!");
        }

        // Cleanup
        // await prisma.deliveryToken.delete({ where: { id: created.id } });

    } catch (e) {
        console.error("Test failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
