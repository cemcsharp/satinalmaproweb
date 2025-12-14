
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Kategoriler ekleniyor...');

    // 1. Ana Kategoriler
    const catMalzeme = await prisma.supplierCategory.create({ data: { name: 'Malzeme Tedariği' } });
    const catHizmet = await prisma.supplierCategory.create({ data: { name: 'Hizmet Alımı' } });

    // 2. Alt Kategoriler (Malzeme)
    await prisma.supplierCategory.create({ data: { name: 'İnşaat & Yapı', parentId: catMalzeme.id } });
    await prisma.supplierCategory.create({ data: { name: 'Ofis & Kırtasiye', parentId: catMalzeme.id } });
    await prisma.supplierCategory.create({ data: { name: 'Bilgisayar & Donanım', parentId: catMalzeme.id } });

    // 3. Alt Kategoriler (Hizmet)
    await prisma.supplierCategory.create({ data: { name: 'Lojistik & Nakliye', parentId: catHizmet.id } });
    await prisma.supplierCategory.create({ data: { name: 'Yazılım & Danışmanlık', parentId: catHizmet.id } });
    await prisma.supplierCategory.create({ data: { name: 'Bakım & Onarım', parentId: catHizmet.id } });

    console.log('✅ Kategoriler başarıyla eklendi!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
