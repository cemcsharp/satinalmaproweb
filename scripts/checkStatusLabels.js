
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStatuses() {
    const cat = await prisma.optionCategory.findUnique({ where: { key: 'siparisDurumu' } });
    if (!cat) {
        console.log("No siparisDurumu category!");
        return;
    }
    const items = await prisma.optionItem.findMany({ where: { categoryId: cat.id } });
    console.log("Statuses found:", items.map(i => i.label));
}

checkStatuses()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
