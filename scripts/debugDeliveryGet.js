
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const orderBarcode = '777777'; // Known barcode from user screenshot
    console.log(`Searching for order with barcode: ${orderBarcode}`);

    const order = await prisma.order.findFirst({
        where: { barcode: { contains: orderBarcode } }
    });

    if (!order) {
        console.log("Order not found");
        return;
    }
    console.log(`Order ID: ${order.id}`);

    console.log("Fetching deliveries with simple query...");
    const simpleDeliveries = await prisma.deliveryReceipt.findMany({
        where: { orderId: order.id }
    });
    console.log("Simple Deliveries:", simpleDeliveries);

    console.log("Fetching deliveries with FULL include (simulating API)...");
    try {
        const fullDeliveries = await prisma.deliveryReceipt.findMany({
            where: { orderId: order.id },
            include: {
                items: { include: { orderItem: true } },
                receiver: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                },
                attachments: true
            },
            orderBy: { date: "desc" }
        });
        console.log("Full Deliveries:", JSON.stringify(fullDeliveries, null, 2));
    } catch (error) {
        console.error("Error fetching full deliveries:", error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
