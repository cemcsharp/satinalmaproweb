import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Faz 0: Temiz Başlangıç (Tabula Rasa) başlatılıyor...');

    try {
        // 1. İşlem verilerini temizle (Sıra önemli: Releationships)
        console.log('🧹 İşlem verileri temizleniyor (RFQ, Teklif, Sipariş, Talep)...');

        // Alt tablolar
        await prisma.offerItem.deleteMany();
        await prisma.offer.deleteMany();
        await prisma.rfqMessage.deleteMany();
        await prisma.rfqSupplier.deleteMany();
        await prisma.rfqItem.deleteMany();
        await prisma.rfq.deleteMany();

        await prisma.deliveryItem.deleteMany();
        await prisma.deliveryReceipt.deleteMany();
        await prisma.orderItem.deleteMany();
        await prisma.order.deleteMany();

        await prisma.requestItem.deleteMany();
        await prisma.request.deleteMany();

        await prisma.product.deleteMany();
        await prisma.supplierCategoryMapping.deleteMany();
        await prisma.supplierCategory.deleteMany();

        console.log('✅ İşlem verileri ve kategoriler temizlendi.');

        // 2. Kullanıcı rollerini sıfırla
        console.log('👤 Kullanıcı rolleri sıfırlanıyor...');
        await prisma.user.updateMany({
            data: {
                role: 'user',
                roleId: null,
                departmentId: null
            }
        });
        console.log('✅ Kullanıcı rolleri ve departman bağları sıfırlandı.');

        // 3. Mevcut rolleri temizle (Yeni profesyonel roller eklenecek)
        console.log('🔑 Eski roller temizleniyor...');
        await prisma.role.deleteMany({
            where: {
                isSystem: false // Sistem rollerini (varsa) koru, özelleri sil
            }
        });
        console.log('✅ Roller temizlendi.');

        console.log('✨ Faz 0 Veri Temizliği başarıyla tamamlandı.');
    } catch (error) {
        console.error('❌ Hata oluştu:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
