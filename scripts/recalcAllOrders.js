
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recalc() {
    const orders = await prisma.order.findMany({
        include: {
            items: true,
            deliveries: {
                where: { status: 'approved' },
                include: { items: true }
            }
        }
    });

    const statusPartial = await prisma.optionItem.findFirst({ where: { category: { key: 'siparisDurumu' }, label: 'Kısmi Teslimat' } });
    const statusReceived = await prisma.optionItem.findFirst({ where: { category: { key: 'siparisDurumu' }, label: 'Teslim Alındı' } });
    const statusApproved = await prisma.optionItem.findFirst({ where: { category: { key: 'siparisDurumu' }, label: 'Onaylandı' } });

    if (!statusPartial || !statusReceived || !statusApproved) {
        console.log("Missing statuses");
        return;
    }

    for (const order of orders) {
        // Logic from API
        let allItemsDelivered = true;
        let partiallyDelivered = false;

        // If no items, skip (or assume complete?)
        if (order.items.length === 0) continue;

        for (const orderItem of order.items) {
            let totalDelivered = 0;
            for (const d of order.deliveries) {
                const dItem = d.items.find(di => di.orderItemId === orderItem.id);
                if (dItem) {
                    totalDelivered += Number(dItem.quantity);
                }
            }
            if (totalDelivered < Number(orderItem.quantity)) {
                allItemsDelivered = false;
            }
            if (totalDelivered > 0) {
                partiallyDelivered = true;
            }
        }

        let targetStatusId = order.statusId;
        let reason = "";

        if (allItemsDelivered) {
            // If fully delivered, ensure it is "Teslim Alındı" or "Tamamlandı" or "Faturalandı"
            // If currently "Onaylandı" or "Sipariş Verildi" or "Kısmi Teslimat", move to "Teslim Alındı"
            // If already "Tamamlandı", leave it? 
            // Actually, let's strictly fix "Kısmi" vs "Tamam".
            // If user manually closed, we might override. 
            // But for now, let's fix the bug.
            // Wait, if it is "Tamamlandı", keep it.
            // Only if it is NOT final, move to "Teslim Alındı".
            // Current IDs for final: Tamamlandı, Faturalandı, İptal.
            // I'll leave if it is one of those roughly? 
            // No, simpler: Update to Teslim Alındı ONLY if it is currently Kısmi or Onaylandı.
            // BUT user has "Tamamlandı" for a Partial order! That's the bug.
            // So if !allItemsDelivered, I MUST move it out of Tamamlandı?
            // Yes if it's partial.
            targetStatusId = statusReceived.id; // Default for full
        } else if (partiallyDelivered) {
            targetStatusId = statusPartial.id;
        } else {
            // No deliveries.
            // Leave as is (Onaylandı, Sipariş Verildi...)
            continue;
        }

        // Special Check: If partial, but currently Tamamlandı, force update.
        // If full, and currently Tamamlandı, keep Tamamlandı (it's finer state than Received).
        // So:
        if (!allItemsDelivered && partiallyDelivered) {
            if (order.statusId !== statusPartial.id) {
                console.log(`Updating Order ${order.barcode} to Kısmi Teslimat (Was: ${order.statusId})`);
                await prisma.order.update({ where: { id: order.id }, data: { statusId: statusPartial.id } });
            }
        } else if (allItemsDelivered) {
            // If fully delivered, upgrade only if simpler state
            // If it is Kısmi or Onaylandı -> upgrade to Teslim Alındı
            // If it is Tamamlandı -> Keep
            // Identifying 'Tamamlandı':
            // ID lookup? I don't have it easily. Just check if it changes from Partial.
            // Actually, the user's order is Tamamlandı but Partial. 
            // Wait, logic above says: if !allItemsDelivered -> set Partial.
            // This handles the bug.

            // For the full delivery case:
            if (order.statusId === statusPartial.id || order.statusId === statusApproved.id) {
                console.log(`Updating Order ${order.barcode} to Teslim Alındı`);
                await prisma.order.update({ where: { id: order.id }, data: { statusId: statusReceived.id } });
            }
        }
    }
}

recalc()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
