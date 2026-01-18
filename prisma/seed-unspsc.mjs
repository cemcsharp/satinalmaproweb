/**
 * UNSPSC Kategori Seed - Segment + Family Seviyesi
 * 
 * Bu script platform genelinde kullanılacak UNSPSC kategorilerini yükler.
 * Sadece ilk 2 seviye (Segment + Family) kullanılır.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// UNSPSC Kategorileri - Segment (Seviye 1) ve Family (Seviye 2)
const unspscCategories = [
    // ========== 14 - Kağıt ve Ofis Ürünleri ==========
    { code: "14", name: "Kağıt ve Ofis Ürünleri", parent: null },
    { code: "14-10", name: "Kağıt Malzemeleri", parent: "14" },
    { code: "14-11", name: "Ofis Sarf Malzemeleri", parent: "14" },
    { code: "14-12", name: "Etiket ve Formlar", parent: "14" },

    // ========== 22 - İnşaat ve Yapı ==========
    { code: "22", name: "İnşaat ve Yapı Malzemeleri", parent: null },
    { code: "22-10", name: "İnşaat Makineleri", parent: "22" },
    { code: "22-11", name: "Yapı Malzemeleri", parent: "22" },
    { code: "22-12", name: "Zemin Kaplamaları", parent: "22" },

    // ========== 23 - Sanayi Makineleri ==========
    { code: "23", name: "Sanayi ve Üretim Makineleri", parent: null },
    { code: "23-10", name: "Metal İşleme Makineleri", parent: "23" },
    { code: "23-11", name: "Endüstriyel Robotlar", parent: "23" },
    { code: "23-12", name: "Paketleme Makineleri", parent: "23" },

    // ========== 25 - Araç ve Taşıt ==========
    { code: "25", name: "Araç ve Taşıtlar", parent: null },
    { code: "25-10", name: "Motorlu Taşıtlar", parent: "25" },
    { code: "25-11", name: "Taşıt Yedek Parçaları", parent: "25" },
    { code: "25-12", name: "Lastikler", parent: "25" },

    // ========== 26 - Elektrik ve Aydınlatma ==========
    { code: "26", name: "Elektrik ve Aydınlatma", parent: null },
    { code: "26-10", name: "Elektrik Kabloları", parent: "26" },
    { code: "26-11", name: "Aydınlatma Ürünleri", parent: "26" },
    { code: "26-12", name: "Elektrik Panoları ve Şalterleri", parent: "26" },
    { code: "26-13", name: "Jeneratörler", parent: "26" },
    { code: "26-14", name: "Transformatörler", parent: "26" },

    // ========== 27 - Araç Gereç ve El Aletleri ==========
    { code: "27", name: "Araç Gereç ve El Aletleri", parent: null },
    { code: "27-10", name: "El Aletleri", parent: "27" },
    { code: "27-11", name: "Elektrikli El Aletleri", parent: "27" },
    { code: "27-12", name: "Ölçüm Aletleri", parent: "27" },

    // ========== 31 - Üretim Bileşenleri ==========
    { code: "31", name: "Üretim Bileşenleri", parent: null },
    { code: "31-10", name: "Rulmanlar ve Yataklar", parent: "31" },
    { code: "31-11", name: "Contalar ve Keçeler", parent: "31" },
    { code: "31-12", name: "Bağlantı Elemanları", parent: "31" },
    { code: "31-13", name: "Valfler ve Vanalar", parent: "31" },

    // ========== 40 - HVAC ve İklimlendirme ==========
    { code: "40", name: "HVAC ve İklimlendirme", parent: null },
    { code: "40-10", name: "Isıtma Sistemleri", parent: "40" },
    { code: "40-11", name: "Soğutma Sistemleri", parent: "40" },
    { code: "40-12", name: "Havalandırma Ekipmanları", parent: "40" },
    { code: "40-13", name: "Sıhhi Tesisat", parent: "40" },

    // ========== 43 - Bilgi Teknolojileri ==========
    { code: "43", name: "Bilgi Teknolojileri", parent: null },
    { code: "43-20", name: "Bilgisayar Aksesuarları", parent: "43" },
    { code: "43-21", name: "Bilgisayarlar", parent: "43" },
    { code: "43-22", name: "Yazılım", parent: "43" },
    { code: "43-23", name: "Ağ Ekipmanları", parent: "43" },
    { code: "43-24", name: "Veri Depolama", parent: "43" },

    // ========== 44 - Ofis Ekipmanları ==========
    { code: "44", name: "Ofis Ekipmanları", parent: null },
    { code: "44-10", name: "Kırtasiye Malzemeleri", parent: "44" },
    { code: "44-11", name: "Ofis Mobilyaları", parent: "44" },
    { code: "44-12", name: "Yazıcı ve Fotokopi Makineleri", parent: "44" },
    { code: "44-13", name: "Telefon ve Faks", parent: "44" },

    // ========== 45 - Yayın ve Baskı ==========
    { code: "45", name: "Yayın ve Baskı", parent: null },
    { code: "45-10", name: "Baskı Makineleri", parent: "45" },
    { code: "45-11", name: "Baskı Sarf Malzemeleri", parent: "45" },

    // ========== 46 - Güvenlik ==========
    { code: "46", name: "Güvenlik Ekipmanları", parent: null },
    { code: "46-10", name: "Kişisel Koruyucu Ekipmanlar (KKD)", parent: "46" },
    { code: "46-11", name: "Yangın Söndürme Ekipmanları", parent: "46" },
    { code: "46-12", name: "Güvenlik Kameraları", parent: "46" },
    { code: "46-13", name: "Geçiş Kontrol Sistemleri", parent: "46" },

    // ========== 47 - Temizlik ve Hijyen ==========
    { code: "47", name: "Temizlik ve Hijyen", parent: null },
    { code: "47-13", name: "Temizlik Kimyasalları", parent: "47" },
    { code: "47-14", name: "Kağıt Ürünleri (Havlu, Peçete)", parent: "47" },
    { code: "47-15", name: "Temizlik Ekipmanları", parent: "47" },
    { code: "47-16", name: "Çöp Torbaları", parent: "47" },

    // ========== 50 - Gıda ve İçecek ==========
    { code: "50", name: "Gıda ve İçecek", parent: null },
    { code: "50-10", name: "Yiyecekler", parent: "50" },
    { code: "50-11", name: "İçecekler", parent: "50" },
    { code: "50-12", name: "Kahve ve Çay", parent: "50" },
    { code: "50-13", name: "Şekerleme ve Atıştırmalık", parent: "50" },

    // ========== 51 - İlaç ve Medikal ==========
    { code: "51", name: "İlaç ve Medikal Malzemeler", parent: null },
    { code: "51-10", name: "İlaçlar", parent: "51" },
    { code: "51-11", name: "Tıbbi Sarf Malzemeleri", parent: "51" },
    { code: "51-12", name: "Tıbbi Cihazlar", parent: "51" },
    { code: "51-13", name: "Laboratuvar Malzemeleri", parent: "51" },

    // ========== 53 - Tekstil ==========
    { code: "53", name: "Tekstil ve Giyim", parent: null },
    { code: "53-10", name: "İş Elbiseleri", parent: "53" },
    { code: "53-11", name: "Kumaş ve Tekstil Ürünleri", parent: "53" },
    { code: "53-12", name: "Promosyon Tekstil", parent: "53" },

    // ========== 56 - Mobilya ==========
    { code: "56", name: "Mobilya ve Dekorasyon", parent: null },
    { code: "56-10", name: "Ofis Mobilyaları", parent: "56" },
    { code: "56-11", name: "Oturma Grupları", parent: "56" },
    { code: "56-12", name: "Depolama ve Raflar", parent: "56" },

    // ========== 72 - İnşaat Hizmetleri ==========
    { code: "72", name: "İnşaat Hizmetleri", parent: null },
    { code: "72-10", name: "Yapı İnşaat Hizmetleri", parent: "72" },
    { code: "72-11", name: "Tadilat ve Renovasyon", parent: "72" },
    { code: "72-12", name: "Tesisat Hizmetleri", parent: "72" },

    // ========== 76 - Endüstriyel Temizlik Hizmetleri ==========
    { code: "76", name: "Temizlik Hizmetleri", parent: null },
    { code: "76-10", name: "Bina Temizlik Hizmetleri", parent: "76" },
    { code: "76-11", name: "Endüstriyel Temizlik", parent: "76" },
    { code: "76-12", name: "Haşere Kontrolü", parent: "76" },

    // ========== 78 - Ulaşım Hizmetleri ==========
    { code: "78", name: "Ulaşım ve Lojistik Hizmetleri", parent: null },
    { code: "78-10", name: "Kargo ve Kurye", parent: "78" },
    { code: "78-11", name: "Nakliye Hizmetleri", parent: "78" },
    { code: "78-12", name: "Depolama Hizmetleri", parent: "78" },

    // ========== 80 - Yönetim Hizmetleri ==========
    { code: "80", name: "İş Destek Hizmetleri", parent: null },
    { code: "80-10", name: "Danışmanlık Hizmetleri", parent: "80" },
    { code: "80-11", name: "İnsan Kaynakları Hizmetleri", parent: "80" },
    { code: "80-12", name: "Muhasebe Hizmetleri", parent: "80" },
    { code: "80-13", name: "Hukuk Hizmetleri", parent: "80" },

    // ========== 81 - Mühendislik Hizmetleri ==========
    { code: "81", name: "Mühendislik ve Teknik Hizmetler", parent: null },
    { code: "81-10", name: "Mühendislik Danışmanlık", parent: "81" },
    { code: "81-11", name: "Bakım ve Onarım", parent: "81" },
    { code: "81-12", name: "Kalibrasyon Hizmetleri", parent: "81" },

    // ========== 82 - Reklam ve Pazarlama ==========
    { code: "82", name: "Reklam ve Pazarlama", parent: null },
    { code: "82-10", name: "Reklam Hizmetleri", parent: "82" },
    { code: "82-11", name: "Promosyon Ürünleri", parent: "82" },
    { code: "82-12", name: "Etkinlik Organizasyonu", parent: "82" },

    // ========== 86 - Eğitim Hizmetleri ==========
    { code: "86", name: "Eğitim ve Seminer", parent: null },
    { code: "86-10", name: "Mesleki Eğitimler", parent: "86" },
    { code: "86-11", name: "Sertifika Programları", parent: "86" },
    { code: "86-12", name: "Konferans ve Seminer", parent: "86" },
];

async function seedUNSPSC() {
    console.log("🌱 UNSPSC Kategorileri yükleniyor...\n");

    // ID'leri tutmak için map
    const codeToId = new Map();

    // Önce Segment'leri (parent null olanları) oluştur
    const segments = unspscCategories.filter(c => c.parent === null);
    for (const cat of segments) {
        const existing = await prisma.supplierCategory.findFirst({
            where: { code: cat.code }
        });

        if (existing) {
            codeToId.set(cat.code, existing.id);
            console.log(`✓ [${cat.code}] ${cat.name} (mevcut)`);
        } else {
            const created = await prisma.supplierCategory.create({
                data: {
                    name: cat.name,
                    code: cat.code,
                    level: 1, // Segment
                    parentId: null
                }
            });
            codeToId.set(cat.code, created.id);
            console.log(`+ [${cat.code}] ${cat.name}`);
        }
    }

    // Sonra Family'leri (parent olanları) oluştur
    const families = unspscCategories.filter(c => c.parent !== null);
    for (const cat of families) {
        const parentId = codeToId.get(cat.parent);
        if (!parentId) {
            console.log(`⚠ Parent bulunamadı: ${cat.parent} -> ${cat.name}`);
            continue;
        }

        const existing = await prisma.supplierCategory.findFirst({
            where: { code: cat.code }
        });

        if (existing) {
            codeToId.set(cat.code, existing.id);
            console.log(`  ✓ [${cat.code}] ${cat.name} (mevcut)`);
        } else {
            const created = await prisma.supplierCategory.create({
                data: {
                    name: cat.name,
                    code: cat.code,
                    level: 2, // Family
                    parentId
                }
            });
            codeToId.set(cat.code, created.id);
            console.log(`  + [${cat.code}] ${cat.name}`);
        }
    }

    const stats = {
        segments: segments.length,
        families: families.length,
        total: segments.length + families.length
    };

    console.log("\n" + "=".repeat(50));
    console.log(`✅ UNSPSC Kategorileri yüklendi!`);
    console.log(`   Segment (Ana Kategori): ${stats.segments}`);
    console.log(`   Family (Alt Kategori): ${stats.families}`);
    console.log(`   Toplam: ${stats.total}`);
    console.log("=".repeat(50));

    await prisma.$disconnect();
}

seedUNSPSC().catch(console.error);
