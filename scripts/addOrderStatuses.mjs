// Script to add new order status values
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Find the siparisDurumu category
    const category = await prisma.optionCategory.findUnique({
        where: { key: "siparisDurumu" }
    });

    if (!category) {
        console.error("siparisDurumu category not found!");
        return;
    }

    // Add Faturalandı status
    await prisma.optionItem.upsert({
        where: { id: "s3" },
        update: { label: "Faturalandı", active: true, sort: 3, categoryId: category.id },
        create: { id: "s3", label: "Faturalandı", active: true, sort: 3, categoryId: category.id },
    });

    // Add Tamamlandı status
    await prisma.optionItem.upsert({
        where: { id: "s4" },
        update: { label: "Tamamlandı", active: true, sort: 4, categoryId: category.id },
        create: { id: "s4", label: "Tamamlandı", active: true, sort: 4, categoryId: category.id },
    });

    console.log("Added Faturalandı and Tamamlandı statuses successfully!");
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
