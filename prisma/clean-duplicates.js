/**
 * Kategori Temizleme - Yinelenenleri bul ve sil
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Benzer isimleri normalleştir (& → ve, boşlukları düzelt)
function normalize(str) {
    return str
        .toLowerCase()
        .replace(/&/g, 've')
        .replace(/\s+/g, ' ')
        .trim();
}

async function cleanDuplicates() {
    console.log("🔍 Yinelenen kategoriler kontrol ediliyor...\n");

    const allCategories = await prisma.supplierCategory.findMany({
        orderBy: { createdAt: 'asc' }
    });

    console.log(`Toplam kategori: ${allCategories.length}\n`);

    // Normalize edilmiş isimlere göre grupla
    const groups = new Map();

    for (const cat of allCategories) {
        const normalName = normalize(cat.name);
        if (!groups.has(normalName)) {
            groups.set(normalName, []);
        }
        groups.get(normalName).push(cat);
    }

    // Yinelenenleri bul
    const duplicates = [];
    for (const [normalName, cats] of groups) {
        if (cats.length > 1) {
            console.log(`⚠️ Yinelenen: "${normalName}"`);
            cats.forEach((c, i) => {
                console.log(`   ${i + 1}. "${c.name}" (id: ${c.id}, code: ${c.code || 'yok'})`);
            });

            // İlk olan hariç diğerlerini silme listesine ekle (UNSPSC kodu olanı tut)
            const withCode = cats.find(c => c.code);
            const toKeep = withCode || cats[0];
            const toDelete = cats.filter(c => c.id !== toKeep.id);

            console.log(`   → Tutulan: "${toKeep.name}" (${toKeep.id})`);
            duplicates.push(...toDelete);
        }
    }

    if (duplicates.length === 0) {
        console.log("\n✅ Yinelenen kategori bulunamadı!");
    } else {
        console.log(`\n🗑️ ${duplicates.length} adet yinelenen kategori siliniyor...`);

        for (const dup of duplicates) {
            try {
                // Önce bu kategoriye bağlı supplier mapping'leri sil
                await prisma.supplierCategoryMapping.deleteMany({
                    where: { categoryId: dup.id }
                });

                // Kategoriyi sil
                await prisma.supplierCategory.delete({
                    where: { id: dup.id }
                });
                console.log(`   ✓ Silindi: "${dup.name}" (${dup.id})`);
            } catch (err) {
                console.log(`   ✗ Silinemedi: "${dup.name}" - ${err.message}`);
            }
        }
    }

    // Sonuç
    const remaining = await prisma.supplierCategory.count();
    console.log(`\n${"=".repeat(50)}`);
    console.log(`✅ Temizlik tamamlandı!`);
    console.log(`   Kalan kategori sayısı: ${remaining}`);
    console.log("=".repeat(50));

    await prisma.$disconnect();
}

cleanDuplicates().catch(console.error);
