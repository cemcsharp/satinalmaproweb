import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Demo veri ekleniyor...');

    // Kullanıcıyı bul
    const user = await prisma.user.findFirst({ where: { email: 'cemtur@gmail.com' } });
    if (!user) {
        console.log('Kullanıcı bulunamadı!');
        return;
    }
    console.log('Kullanıcı bulundu:', user.email);

    // Tenant bul veya oluştur
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        tenant = await prisma.tenant.create({
            data: {
                name: 'Demo Şirket A.Ş.',
                slug: 'demo-sirket',
                email: 'info@demo.com',
            }
        });
    }
    console.log('Tenant:', tenant.name);

    // Kullanıcıyı tenant'a bağla
    await prisma.user.update({
        where: { id: user.id },
        data: { tenantId: tenant.id }
    });

    // Demo tedarikçiler oluştur
    const supplierNames = [
        { name: 'ABC Teknoloji Ltd.', email: 'satis@abc-tek.com', phone: '0212 555 1234' },
        { name: 'XYZ Elektronik A.Ş.', email: 'info@xyz-elektronik.com', phone: '0216 444 5678' },
        { name: 'Mega Bilgisayar', email: 'destek@megabilgisayar.com', phone: '0312 333 9012' },
        { name: 'İstanbul Ofis Malzemeleri', email: 'siparis@istanbulofis.com', phone: '0212 777 3456' },
        { name: 'Anadolu Kırtasiye', email: 'satis@anadolukirtasiye.com', phone: '0322 888 7890' },
    ];

    const suppliers = [];
    for (const s of supplierNames) {
        const existing = await prisma.supplier.findFirst({ where: { email: s.email } });
        if (!existing) {
            const supplier = await prisma.supplier.create({
                data: {
                    name: s.name,
                    email: s.email,
                    phone: s.phone,
                    active: true,
                    registrationStatus: 'approved',
                    platformApproved: true,
                    isVerified: true,
                }
            });
            suppliers.push(supplier);
        } else {
            suppliers.push(existing);
        }
    }
    console.log(`${suppliers.length} tedarikçi hazır`);

    // OptionItem'ları bul (status, unit, currency için)
    const statusCategory = await prisma.optionCategory.findUnique({ where: { key: 'request_status' } });
    const unitCategory = await prisma.optionCategory.findUnique({ where: { key: 'unit' } });
    const currencyCategory = await prisma.optionCategory.findUnique({ where: { key: 'currency' } });

    let statusId, unitId, currencyId, relatedPersonId;

    if (statusCategory) {
        const statusItem = await prisma.optionItem.findFirst({ where: { categoryId: statusCategory.id } });
        if (statusItem) statusId = statusItem.id;
    }
    if (unitCategory) {
        const unitItem = await prisma.optionItem.findFirst({ where: { categoryId: unitCategory.id } });
        if (unitItem) {
            unitId = unitItem.id;
            relatedPersonId = unitItem.id; // Aynısını kullan
        }
    }
    if (currencyCategory) {
        const currencyItem = await prisma.optionItem.findFirst({ where: { categoryId: currencyCategory.id } });
        if (currencyItem) currencyId = currencyItem.id;
    }

    // Gerekli OptionItem'lar yoksa oluştur
    if (!statusId || !unitId || !currencyId) {
        console.log('OptionItem bulunamadı, category oluşturuluyor...');

        // Status category
        let statCat = await prisma.optionCategory.upsert({
            where: { key: 'request_status' },
            update: {},
            create: { key: 'request_status', name: 'Talep Durumları' }
        });
        let statItem = await prisma.optionItem.findFirst({ where: { categoryId: statCat.id } });
        if (!statItem) {
            statItem = await prisma.optionItem.create({
                data: { label: 'Beklemede', categoryId: statCat.id }
            });
        }
        statusId = statItem.id;

        // Unit category
        let unitCat = await prisma.optionCategory.upsert({
            where: { key: 'unit' },
            update: {},
            create: { key: 'unit', name: 'Birimler' }
        });
        let unitItem = await prisma.optionItem.findFirst({ where: { categoryId: unitCat.id } });
        if (!unitItem) {
            unitItem = await prisma.optionItem.create({
                data: { label: 'Adet', categoryId: unitCat.id }
            });
        }
        unitId = unitItem.id;
        relatedPersonId = unitItem.id;

        // Currency category
        let currCat = await prisma.optionCategory.upsert({
            where: { key: 'currency' },
            update: {},
            create: { key: 'currency', name: 'Para Birimleri' }
        });
        let currItem = await prisma.optionItem.findFirst({ where: { categoryId: currCat.id } });
        if (!currItem) {
            currItem = await prisma.optionItem.create({
                data: { label: 'TRY', categoryId: currCat.id }
            });
        }
        currencyId = currItem.id;
    }

    // Company bul veya oluştur
    let company = await prisma.company.findFirst();
    if (!company) {
        company = await prisma.company.create({
            data: { name: 'Demo Şirket A.Ş.', active: true }
        });
    }

    // Demo Talepler oluştur
    const requestSubjects = [
        { subject: 'Ofis Bilgisayarları Alımı', budget: 150000 },
        { subject: '10 Adet Yazıcı İhtiyacı', budget: 45000 },
        { subject: 'Yıllık Kırtasiye Malzemeleri', budget: 25000 },
        { subject: 'Sunucu Odası Ekipmanları', budget: 320000 },
        { subject: 'Çalışan Dizüstü Bilgisayarları', budget: 180000 },
    ];

    for (let i = 0; i < requestSubjects.length; i++) {
        const req = requestSubjects[i];
        const barcode = `TAL-2024-${String(i + 1).padStart(4, '0')}`;

        const exists = await prisma.request.findUnique({ where: { barcode } });
        if (!exists) {
            await prisma.request.create({
                data: {
                    barcode,
                    subject: req.subject,
                    budget: req.budget,
                    statusId,
                    unitId,
                    currencyId,
                    relatedPersonId,
                    ownerUserId: user.id,
                    tenantId: tenant.id,
                }
            });
        }
    }
    console.log(`${requestSubjects.length} talep oluşturuldu`);

    // Demo RFQ'lar oluştur
    const rfqTitles = [
        { title: 'Bilgisayar ve Monitör Teklif Talebi', status: 'ACTIVE' },
        { title: 'Yazıcı ve Toner Teklif Talebi', status: 'ACTIVE' },
        { title: 'Ofis Mobilyası Teklif Talebi', status: 'CLOSED' },
        { title: 'Network Ekipmanları Teklif Talebi', status: 'ACTIVE' },
        { title: 'Güvenlik Kameraları Teklif Talebi', status: 'PENDING' },
        { title: 'Sunucu ve Depolama Çözümleri', status: 'ACTIVE' },
    ];

    for (let i = 0; i < rfqTitles.length; i++) {
        const rfq = rfqTitles[i];
        const rfxCode = `RFQ-2024-${String(i + 1).padStart(4, '0')}`;

        const exists = await prisma.rfq.findUnique({ where: { rfxCode } });
        if (!exists) {
            const deadline = new Date();
            deadline.setDate(deadline.getDate() + (7 + i * 3)); // 7-22 gün deadline

            const newRfq = await prisma.rfq.create({
                data: {
                    rfxCode,
                    title: rfq.title,
                    status: rfq.status,
                    deadline,
                    createdById: user.id,
                    companyId: company.id,
                    tenantId: tenant.id,
                }
            });

            // RFQ'ya tedarikçiler ekle
            const supplierCount = 2 + (i % 3); // 2-4 arası tedarikçi
            for (let j = 0; j < supplierCount && j < suppliers.length; j++) {
                const token = `token-${newRfq.id}-${j}`;
                const tokenExpiry = new Date();
                tokenExpiry.setDate(tokenExpiry.getDate() + 30);

                await prisma.rfqSupplier.create({
                    data: {
                        rfqId: newRfq.id,
                        supplierId: suppliers[j].id,
                        email: suppliers[j].email || 'demo@email.com',
                        token,
                        tokenExpiry,
                        stage: j === 0 ? 'SUBMITTED' : 'PENDING',
                    }
                });
            }

            // RFQ'ya kalemler ekle
            const items = [
                { name: 'Laptop', quantity: 10, unit: 'Adet' },
                { name: 'Monitör', quantity: 10, unit: 'Adet' },
                { name: 'Klavye ve Mouse Seti', quantity: 10, unit: 'Set' },
            ];
            for (const item of items) {
                await prisma.rfqItem.create({
                    data: {
                        rfqId: newRfq.id,
                        name: item.name,
                        quantity: item.quantity,
                        unit: item.unit,
                    }
                });
            }
        }
    }
    console.log(`${rfqTitles.length} RFQ oluşturuldu`);

    console.log('\n✅ Demo veri ekleme tamamlandı!');
    console.log('Sayfayı yenileyerek verileri görebilirsiniz.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
