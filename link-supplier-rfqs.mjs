import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Tedarikçiyi RFQ\'lara bağlıyorum...');

    // Tedarikçi kullanıcısını bul
    const supplierUser = await prisma.user.findUnique({
        where: { email: 'supplier@demo.com' },
        include: { supplier: true }
    });

    if (!supplierUser || !supplierUser.supplier) {
        console.log('Tedarikçi kullanıcısı bulunamadı!');
        return;
    }

    console.log('Tedarikçi:', supplierUser.supplier.name);

    // Tüm RFQ'ları bul
    const rfqs = await prisma.rfq.findMany({
        where: { status: 'ACTIVE' }
    });

    console.log(`${rfqs.length} aktif RFQ bulundu`);

    // Her RFQ'ya bu tedarikçiyi ekle
    for (const rfq of rfqs) {
        // Daha önce eklenmiş mi kontrol et
        const existing = await prisma.rfqSupplier.findFirst({
            where: {
                rfqId: rfq.id,
                supplierId: supplierUser.supplierId
            }
        });

        if (!existing) {
            const token = `portal-${rfq.id}-${Date.now()}`;
            const tokenExpiry = new Date();
            tokenExpiry.setDate(tokenExpiry.getDate() + 30);

            await prisma.rfqSupplier.create({
                data: {
                    rfqId: rfq.id,
                    supplierId: supplierUser.supplierId,
                    email: supplierUser.supplier.email || 'supplier@demo.com',
                    token,
                    tokenExpiry,
                    stage: 'PENDING',
                }
            });
            console.log(`  ✓ ${rfq.title} - eklendi`);
        } else {
            console.log(`  - ${rfq.title} - zaten ekli`);
        }
    }

    console.log('\n✅ Tedarikçi tüm aktif RFQ\'lara bağlandı!');
    console.log('Şimdi portalda "Açık Talepler" bölümünde talepler görünecek.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
