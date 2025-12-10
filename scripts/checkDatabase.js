
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const barcode = '777777';
    const order = await prisma.order.findFirst({
        where: { barcode: { contains: barcode } },
        include: { deliveries: true }
    });

    if (!order) {
        console.log(`Order with barcode containing ${barcode} not found.`);
        return;
    }

    console.log(`Order Found: ${order.id} (${order.barcode})`);
    console.log(`Deliveries Count: ${order.deliveries.length}`);
    console.log('Deliveries:', JSON.stringify(order.deliveries, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
