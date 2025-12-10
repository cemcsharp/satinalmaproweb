
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugOrder() {
    // Find order with matching items
    const order = await prisma.order.findFirst({
        where: {
            items: {
                some: { name: { contains: 'Laptop', mode: 'insensitive' } }
            }
        },
        include: {
            items: true,
            status: true,
            deliveries: {
                include: { items: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    if (!order) {
        console.log("Order not found!");
        return;
    }

    console.log(`Order ID: ${order.id}`);
    console.log(`Barcode: ${order.barcode}`);
    console.log(`Current Status: ${order.status?.label} (ID: ${order.statusId})`);

    console.log("\nOrder Items:");
    order.items.forEach(i => console.log(`- ${i.name}: ${i.quantity}`));

    console.log("\nDeliveries:");
    order.deliveries.forEach(d => {
        console.log(`Receipt ${d.code} (${d.status}):`);
        d.items.forEach(di => console.log(`  - Delivered: ${di.quantity}`));
    });

    // Calculate Logic check
    let allItemsDelivered = true;
    let partiallyDelivered = false;

    for (const orderItem of order.items) {
        let totalDelivered = 0;
        for (const d of order.deliveries) {
            if (d.status !== 'approved') continue; // Only count approved deliveries
            const dItem = d.items.find(di => di.orderItemId === orderItem.id);
            if (dItem) {
                totalDelivered += Number(dItem.quantity);
            }
        }
        console.log(`Item ${orderItem.name}: Ordered ${orderItem.quantity}, Delivered ${totalDelivered}`);

        if (totalDelivered < Number(orderItem.quantity)) {
            allItemsDelivered = false;
        }
        if (totalDelivered > 0) {
            partiallyDelivered = true;
        }
    }

    console.log(`\nLogic Result -> AllDelivered: ${allItemsDelivered}, Partial: ${partiallyDelivered}`);
}

debugOrder()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
