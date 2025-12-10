
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixStatuses() {
    const cat = await prisma.optionCategory.findUnique({ where: { key: 'siparisDurumu' } });
    if (!cat) {
        console.error("Category siparisDurumu not found!");
        return;
    }

    const statuses = [
        { label: "Sipariş Verildi", sort: 1 },
        { label: "Onaylandı", sort: 2 },
        { label: "Kısmi Teslimat", sort: 3 },
        { label: "Teslim Alındı", sort: 4 }, // Fully received
        { label: "Tamamlandı", sort: 5 }, // Archived/Invoiced/Closed
        { label: "İptal Edildi", sort: 6 }
    ];

    for (const s of statuses) {
        const existing = await prisma.optionItem.findFirst({
            where: { categoryId: cat.id, label: s.label }
        });
        if (!existing) {
            await prisma.optionItem.create({
                data: {
                    categoryId: cat.id,
                    label: s.label,
                    sort: s.sort,
                    active: true
                }
            });
            console.log(`Created: ${s.label}`);
        } else {
            await prisma.optionItem.update({
                where: { id: existing.id },
                data: { sort: s.sort }
            });
            console.log(`Updated Sort: ${s.label}`);
        }
    }

    // Optional: Map old statuses to new ones if needed?
    // "Teslimat Sürecinde" -> "Onaylandı" might be a good map if orders are stuck.
    const old = await prisma.optionItem.findFirst({ where: { categoryId: cat.id, label: "Teslimat Sürecinde" } });
    if (old) {
        const target = await prisma.optionItem.findFirst({ where: { categoryId: cat.id, label: "Onaylandı" } });
        if (target) {
            // Update orders using old status
            const { count } = await prisma.order.updateMany({
                where: { statusId: old.id },
                data: { statusId: target.id }
            });
            console.log(`Migrated ${count} orders from 'Teslimat Sürecinde' to 'Onaylandı'`);
            // Deactivate old
            await prisma.optionItem.update({ where: { id: old.id }, data: { active: false } });
        }
    }

    const old2 = await prisma.optionItem.findFirst({ where: { categoryId: cat.id, label: "Sipariş Aşamasında" } });
    if (old2) {
        const target = await prisma.optionItem.findFirst({ where: { categoryId: cat.id, label: "Sipariş Verildi" } });
        if (target) {
            const { count } = await prisma.order.updateMany({
                where: { statusId: old2.id },
                data: { statusId: target.id }
            });
            console.log(`Migrated ${count} orders from 'Sipariş Aşamasında' to 'Sipariş Verildi'`);
            await prisma.optionItem.update({ where: { id: old2.id }, data: { active: false } });
        }
    }

}

fixStatuses()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
