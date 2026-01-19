import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'cemtur@gmail.com';
    console.log(`🚀 Starting total purge except for ${adminEmail}...`);

    try {
        const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
        if (!admin) {
            console.error(`❌ Admin user ${adminEmail} not found! Purge aborted.`);
            return;
        }

        await prisma.$transaction([
            // 1. Delete all transactional data again just in case
            prisma.supplierEvaluationAnswer.deleteMany(),
            prisma.supplierEvaluation.deleteMany(),
            prisma.supplierPerformanceMetric.deleteMany(),
            prisma.supplierEvaluationSummary.deleteMany(),
            prisma.supplierAlert.deleteMany(),
            prisma.invoiceItem.deleteMany(),
            prisma.invoice.deleteMany(),
            prisma.deliveryItem.deleteMany(),
            prisma.deliveryReceipt.deleteMany(),
            prisma.deliveryToken.deleteMany(),
            prisma.contractAttachment.deleteMany(),
            prisma.contractRevision.deleteMany(),
            prisma.contractEvent.deleteMany(),
            prisma.contractHistory.deleteMany(),
            prisma.contract.deleteMany(),
            prisma.rfqMessage.deleteMany(),
            prisma.offerItem.deleteMany(),
            prisma.offer.deleteMany(),
            prisma.rfqSupplier.deleteMany(),
            prisma.rfqItem.deleteMany(),
            prisma.rfq.deleteMany(),
            prisma.orderItem.deleteMany(),
            prisma.order.deleteMany(),
            prisma.requestItem.deleteMany(),
            prisma.comment.deleteMany(),
            prisma.attachment.deleteMany(),
            prisma.request.deleteMany(),
            prisma.approvalRecord.deleteMany(),
            prisma.auditLog.deleteMany(),
            prisma.notification.deleteMany(),
            prisma.emailLog.deleteMany(),
            prisma.loginAttempt.deleteMany(),

            // 2. Delete business entities
            prisma.product.deleteMany(),
            prisma.productCategory.deleteMany(),
            prisma.department.deleteMany(),
            prisma.deliveryAddress.deleteMany(),
            prisma.tenantSupplier.deleteMany(),

            // 3. Delete Users except admin
            prisma.user.deleteMany({
                where: { id: { not: admin.id } }
            }),

            // 4. Delete Companies and Suppliers
            prisma.company.deleteMany(),
            prisma.supplier.deleteMany(),

            // 5. Delete Tenants
            prisma.tenant.deleteMany(),
        ]);

        console.log(`✅ Purge complete. Only user ${adminEmail} remains.`);
    } catch (error) {
        console.error('❌ Error during purge:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
