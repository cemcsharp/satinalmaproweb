// Script to find any order and update its status to Faturalandı
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Find any order
    const order = await prisma.order.findFirst({
        orderBy: { createdAt: "desc" }
    });

    if (!order) {
        console.log("No orders found in database!");
        return;
    }

    console.log(`Found order: ${order.barcode}`);

    // Update to Faturalandı status
    const updated = await prisma.order.update({
        where: { id: order.id },
        data: { statusId: "s3" },
        include: { status: true }
    });

    console.log(`Updated order ${updated.barcode} status to: ${updated.status?.label}`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
