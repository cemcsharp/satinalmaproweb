/**
 * UNSPSC Kategori Güncelleme - Kodları ekle
 * 
 * Bu script mevcut kategorilere UNSPSC kodlarını ekler.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// UNSPSC Kodları - name -> code mapping
const codeMapping = {
    // Segments (Ana Kategoriler)
    "Kağıt ve Ofis Ürünleri": "14",
    "İnşaat ve Yapı Malzemeleri": "22",
    "Sanayi ve Üretim Makineleri": "23",
    "Araç ve Taşıtlar": "25",
    "Elektrik ve Aydınlatma": "26",
    "Araç Gereç ve El Aletleri": "27",
    "Üretim Bileşenleri": "31",
    "HVAC ve İklimlendirme": "40",
    "Bilgi Teknolojileri": "43",
    "Ofis Ekipmanları": "44",
    "Yayın ve Baskı": "45",
    "Güvenlik Ekipmanları": "46",
    "Temizlik ve Hijyen": "47",
    "Gıda ve İçecek": "50",
    "İlaç ve Medikal Malzemeler": "51",
    "Tekstil ve Giyim": "53",
    "Mobilya ve Dekorasyon": "56",
    "İnşaat Hizmetleri": "72",
    "Temizlik Hizmetleri": "76",
    "Ulaşım ve Lojistik Hizmetleri": "78",
    "İş Destek Hizmetleri": "80",
    "Mühendislik ve Teknik Hizmetler": "81",
    "Reklam ve Pazarlama": "82",
    "Eğitim ve Seminer": "86",

    // Families (Alt Kategoriler)
    "Kağıt Malzemeleri": "14-10",
    "Ofis Sarf Malzemeleri": "14-11",
    "Etiket ve Formlar": "14-12",
    "İnşaat Makineleri": "22-10",
    "Yapı Malzemeleri": "22-11",
    "Zemin Kaplamaları": "22-12",
    "Metal İşleme Makineleri": "23-10",
    "Endüstriyel Robotlar": "23-11",
    "Paketleme Makineleri": "23-12",
    "Motorlu Taşıtlar": "25-10",
    "Taşıt Yedek Parçaları": "25-11",
    "Lastikler": "25-12",
    "Elektrik Kabloları": "26-10",
    "Aydınlatma Ürünleri": "26-11",
    "Elektrik Panoları ve Şalterleri": "26-12",
    "Jeneratörler": "26-13",
    "Transformatörler": "26-14",
    "El Aletleri": "27-10",
    "Elektrikli El Aletleri": "27-11",
    "Ölçüm Aletleri": "27-12",
    "Rulmanlar ve Yataklar": "31-10",
    "Contalar ve Keçeler": "31-11",
    "Bağlantı Elemanları": "31-12",
    "Valfler ve Vanalar": "31-13",
    "Isıtma Sistemleri": "40-10",
    "Soğutma Sistemleri": "40-11",
    "Havalandırma Ekipmanları": "40-12",
    "Sıhhi Tesisat": "40-13",
    "Bilgisayar Aksesuarları": "43-20",
    "Bilgisayarlar": "43-21",
    "Yazılım": "43-22",
    "Ağ Ekipmanları": "43-23",
    "Veri Depolama": "43-24",
    "Kırtasiye Malzemeleri": "44-10",
    "Ofis Mobilyaları": "44-11",
    "Yazıcı ve Fotokopi Makineleri": "44-12",
    "Telefon ve Faks": "44-13",
    "Baskı Makineleri": "45-10",
    "Baskı Sarf Malzemeleri": "45-11",
    "Kişisel Koruyucu Ekipmanlar (KKD)": "46-10",
    "Yangın Söndürme Ekipmanları": "46-11",
    "Güvenlik Kameraları": "46-12",
    "Geçiş Kontrol Sistemleri": "46-13",
    "Temizlik Kimyasalları": "47-13",
    "Kağıt Ürünleri (Havlu, Peçete)": "47-14",
    "Temizlik Ekipmanları": "47-15",
    "Çöp Torbaları": "47-16",
    "Yiyecekler": "50-10",
    "İçecekler": "50-11",
    "Kahve ve Çay": "50-12",
    "Şekerleme ve Atıştırmalık": "50-13",
    "İlaçlar": "51-10",
    "Tıbbi Sarf Malzemeleri": "51-11",
    "Tıbbi Cihazlar": "51-12",
    "Laboratuvar Malzemeleri": "51-13",
    "İş Elbiseleri": "53-10",
    "Kumaş ve Tekstil Ürünleri": "53-11",
    "Promosyon Tekstil": "53-12",
    "Depolama ve Raflar": "56-12",
    "Oturma Grupları": "56-11",
    "Yapı İnşaat Hizmetleri": "72-10",
    "Tadilat ve Renovasyon": "72-11",
    "Tesisat Hizmetleri": "72-12",
    "Bina Temizlik Hizmetleri": "76-10",
    "Endüstriyel Temizlik": "76-11",
    "Haşere Kontrolü": "76-12",
    "Kargo ve Kurye": "78-10",
    "Nakliye Hizmetleri": "78-11",
    "Depolama Hizmetleri": "78-12",
    "Danışmanlık Hizmetleri": "80-10",
    "İnsan Kaynakları Hizmetleri": "80-11",
    "Muhasebe Hizmetleri": "80-12",
    "Hukuk Hizmetleri": "80-13",
    "Mühendislik Danışmanlık": "81-10",
    "Bakım ve Onarım": "81-11",
    "Kalibrasyon Hizmetleri": "81-12",
    "Reklam Hizmetleri": "82-10",
    "Promosyon Ürünleri": "82-11",
    "Etkinlik Organizasyonu": "82-12",
    "Mesleki Eğitimler": "86-10",
    "Sertifika Programları": "86-11",
    "Konferans ve Seminer": "86-12",
};

async function updateCodes() {
    console.log("🔄 UNSPSC Kodları güncelleniyor...\n");

    let updated = 0;
    let notFound = 0;

    for (const [name, code] of Object.entries(codeMapping)) {
        const category = await prisma.supplierCategory.findFirst({
            where: { name }
        });

        if (category) {
            await prisma.supplierCategory.update({
                where: { id: category.id },
                data: { code }
            });
            console.log(`✓ [${code}] ${name}`);
            updated++;
        } else {
            console.log(`⚠ Bulunamadı: ${name}`);
            notFound++;
        }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`✅ UNSPSC Kodları güncellendi!`);
    console.log(`   Güncellenen: ${updated}`);
    console.log(`   Bulunamayan: ${notFound}`);
    console.log("=".repeat(50));

    await prisma.$disconnect();
}

updateCodes().catch(console.error);
