import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting business data reset...');

    try {
        // Delete in order to respect foreign key constraints
        await prisma.$transaction([
            // 1. Evaluations and Scopes
            prisma.supplierEvaluationAnswer.deleteMany(),
            prisma.supplierEvaluation.deleteMany(),
            prisma.supplierPerformanceMetric.deleteMany(),
            prisma.supplierEvaluationSummary.deleteMany(),
            prisma.supplierAlert.deleteMany(),

            // 2. Invoices and Deliveries
            prisma.invoiceItem.deleteMany(),
            prisma.invoice.deleteMany(),
            prisma.deliveryItem.deleteMany(),
            prisma.deliveryReceipt.deleteMany(),
            prisma.deliveryToken.deleteMany(),

            // 3. Contracts
            prisma.contractAttachment.deleteMany(),
            prisma.contractRevision.deleteMany(),
            prisma.contractEvent.deleteMany(),
            prisma.contractHistory.deleteMany(),
            prisma.contract.deleteMany(),

            // 4. RFQs and Offers
            prisma.rfqMessage.deleteMany(),
            prisma.offerItem.deleteMany(),
            prisma.offer.deleteMany(),
            prisma.rfqSupplier.deleteMany(),
            prisma.rfqItem.deleteMany(),
            prisma.rfq.deleteMany(),

            // 5. Orders
            prisma.orderItem.deleteMany(),
            prisma.order.deleteMany(),

            // 6. Requests
            prisma.requestItem.deleteMany(),
            prisma.comment.deleteMany(),
            prisma.attachment.deleteMany(),
            prisma.request.deleteMany(),

            // 7. System and Audit
            prisma.approvalRecord.deleteMany(),
            prisma.auditLog.deleteMany(),
            prisma.notification.deleteMany(),
            prisma.emailLog.deleteMany(),
            prisma.loginAttempt.deleteMany(),
        ]);

        console.log('✅ All business data has been cleared successfully.');
    } catch (error) {
        console.error('❌ Error clearing business data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
