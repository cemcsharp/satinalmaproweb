
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnose() {
    console.log("--- DIAGNOSIS START ---");

    // 1. Check if DeliveryReceipt model has receiverEmail
    console.log("1. Testing DB Schema for 'receiverEmail'...");
    try {
        // Attempt to find any receipt and see if we can select receiverEmail
        // If column doesn't exist, this might throw or return undefined depending on client version
        // Better: Try to create a transaction that rolls back
        await prisma.$transaction(async (tx) => {
            // Create a dummy order if needed, but easier to just check keys of a raw query if possible, 
            // or just try to create with the field.

            // Let's try to fetch one first
            const first = await tx.deliveryReceipt.findFirst();
            if (first) {
                console.log("   Existing receipt found:", first.id);
                // Note: Prisma Client filters out fields not in schema.prisma, 
                // but if DB table lacks column, writing provided field will fail.
            } else {
                console.log("   No existing receipts.");
            }
        });
        console.log("   Read check passed (client didn't crash).");
    } catch (e) {
        console.error("   Read check FAILED:", e.message);
    }

    // 2. Try to simulated a 'Create' with receiverEmail
    console.log("2. Testing Write Capability...");
    try {
        // We need a valid Order ID to create a receipt.
        const order = await prisma.order.findFirst();
        if (!order) {
            console.log("   Skipping write test: No orders found.");
        } else {
            console.log("   Using Order:", order.id);
            const r = await prisma.deliveryReceipt.create({
                data: {
                    orderId: order.id,
                    code: "TEST-DIAG-" + Date.now(),
                    date: new Date(),
                    receiverName: "System Diagnose",
                    receiverEmail: "test@example.com", // THIS IS THE KEY FIELD
                    status: "pending"
                }
            });
            console.log("   Write SUCCESS. Created Receipt:", r.id);
            // Clean up
            await prisma.deliveryReceipt.delete({ where: { id: r.id } });
            console.log("   Cleanup SUCCESS.");
        }
    } catch (e) {
        console.error("   Write FAILED:", e.message);
        if (e.message.includes("column")) {
            console.error("   CRITICAL: Database column missing!");
        }
    }

    console.log("--- DIAGNOSIS END ---");
}

diagnose()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
