
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function main() {
    try {
        // Find an order
        const order = await prisma.order.findFirst();
        if (!order) {
            console.log("No order found");
            return;
        }

        console.log("Found order:", order.id);

        const token = "DEBUG-" + crypto.randomBytes(4).toString("hex").toUpperCase();
        console.log("Generated token:", token);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const created = await prisma.deliveryToken.create({
            data: {
                token,
                orderId: order.id,
                expiresAt
            }
        });

        console.log("Success:", created);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
