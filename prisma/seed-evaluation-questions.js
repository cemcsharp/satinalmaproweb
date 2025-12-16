const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Skor tipleri
const SCORING_TYPES = [
    { code: 'hizmet', name: 'Hizmet Değerlendirmesi', kind: 'rating', scaleMin: 1, scaleMax: 5, weightA: 0.40, weightB: 0.35, weightC: 0.25 },
    { code: 'malzeme', name: 'Malzeme Değerlendirmesi', kind: 'rating', scaleMin: 1, scaleMax: 5, weightA: 0.40, weightB: 0.30, weightC: 0.30 },
    { code: 'danismanlik', name: 'Danışmanlık Değerlendirmesi', kind: 'rating', scaleMin: 1, scaleMax: 5, weightA: 0.40, weightB: 0.30, weightC: 0.30 },
    { code: 'bakim', name: 'Bakım/Onarım Değerlendirmesi', kind: 'rating', scaleMin: 1, scaleMax: 5, weightA: 0.35, weightB: 0.35, weightC: 0.30 },
    { code: 'insaat', name: 'İnşaat Değerlendirmesi', kind: 'rating', scaleMin: 1, scaleMax: 5, weightA: 0.35, weightB: 0.35, weightC: 0.30 },
];

// Sorular - section: A, B, C
const QUESTIONS = {
    hizmet: [
        { section: 'A', text: 'Hizmet Şartnamesine Uygunluk', sort: 1 },
        { section: 'A', text: 'Personel Yeterliliği ve Deneyimi', sort: 2 },
        { section: 'A', text: 'Ekipman/Malzeme Kalitesi', sort: 3 },
        { section: 'A', text: 'Hata/Şikayet Oranı', sort: 4 },
        { section: 'A', text: 'Sorun Çözme Hızı ve Etkinliği', sort: 5 },
        { section: 'B', text: 'Süre Taahhütlerine Uygunluk', sort: 1 },
        { section: 'B', text: 'Personel Devamlılığı ve Hızı', sort: 2 },
        { section: 'B', text: 'Esneklik ve Acil Taleplere Cevap', sort: 3 },
        { section: 'B', text: 'İletişim ve Raporlama Şeffaflığı', sort: 4 },
        { section: 'C', text: 'Fiyat Rekabetçiliği ve Şeffaflığı', sort: 1 },
        { section: 'C', text: 'Ödeme Koşullarına Uygunluk', sort: 2 },
        { section: 'C', text: 'Kurumsal Yapı ve Belgelendirme', sort: 3 },
        { section: 'C', text: 'İSG Uyumu', sort: 4 },
        { section: 'C', text: 'Referanslar ve Pazarda İtibar', sort: 5 },
    ],
    malzeme: [
        { section: 'A', text: 'Teknik Şartnameye Uygunluk', sort: 1 },
        { section: 'A', text: 'Red/İade Oranı', sort: 2 },
        { section: 'A', text: 'Garanti ve Satış Sonrası Hizmet', sort: 3 },
        { section: 'A', text: 'Sertifikasyon ve Belgelendirme', sort: 4 },
        { section: 'A', text: 'Stok Sürekliliği', sort: 5 },
        { section: 'B', text: 'Fiyat Düzeyi', sort: 1 },
        { section: 'B', text: 'Fiyat İstikrarı ve Şeffaflığı', sort: 2 },
        { section: 'B', text: 'Ödeme Koşulları ve Vade', sort: 3 },
        { section: 'B', text: 'Toplu Alım/İndirim Esnekliği', sort: 4 },
        { section: 'C', text: 'Zamanında Teslimat', sort: 1 },
        { section: 'C', text: 'Miktara Uygunluk', sort: 2 },
        { section: 'C', text: 'Ambalajlama ve Hasarsız Teslimat', sort: 3 },
        { section: 'C', text: 'Lojistik ve Takip', sort: 4 },
    ],
    danismanlik: [
        { section: 'A', text: 'Uzmanlık Deneyimi', sort: 1 },
        { section: 'A', text: 'Proje Ekibi Nitelikleri', sort: 2 },
        { section: 'A', text: 'Metodoloji ve Yaklaşım', sort: 3 },
        { section: 'A', text: 'Gizlilik ve Fikri Mülkiyet', sort: 4 },
        { section: 'A', text: 'Referanslar ve Akademik İlişkiler', sort: 5 },
        { section: 'B', text: 'Takvim ve Terminlere Uygunluk', sort: 1 },
        { section: 'B', text: 'İletişim ve Raporlama', sort: 2 },
        { section: 'B', text: 'İşbirliği ve Koordinasyon', sort: 3 },
        { section: 'B', text: 'Çıktıların Uygulanabilirliği', sort: 4 },
        { section: 'C', text: 'Maliyet Rekabetçiliği ve Kapsamı', sort: 1 },
        { section: 'C', text: 'Ödeme Planı ve Esneklik', sort: 2 },
        { section: 'C', text: 'Süre/Bütçe İçinde Kalma', sort: 3 },
        { section: 'C', text: 'Finansal İstikrar', sort: 4 },
    ],
    bakim: [
        { section: 'A', text: 'Teknik Uzmanlık ve Sertifikasyon', sort: 1 },
        { section: 'A', text: 'Arıza Tespit ve Onarım Başarısı', sort: 2 },
        { section: 'A', text: 'Yedek Parça/Malzeme Kalitesi', sort: 3 },
        { section: 'A', text: 'İşçilik Kalitesi ve Garanti', sort: 4 },
        { section: 'A', text: 'Önleyici Bakım Yeterliliği', sort: 5 },
        { section: 'B', text: 'Acil Durum Müdahale Hızı', sort: 1 },
        { section: 'B', text: 'Taahhüt Süresi Uygunluğu', sort: 2 },
        { section: 'B', text: 'İSG Uygulamaları', sort: 3 },
        { section: 'B', text: 'Alan Düzeni ve Temizlik', sort: 4 },
        { section: 'B', text: 'İletişim ve Raporlama', sort: 5 },
        { section: 'C', text: 'Fiyatlandırma Şeffaflığı', sort: 1 },
        { section: 'C', text: 'Maliyet Sapması', sort: 2 },
        { section: 'C', text: 'Kapasite (Personel/Ekipman)', sort: 3 },
        { section: 'C', text: 'Finansal İstikrar ve Referanslar', sort: 4 },
    ],
    insaat: [
        { section: 'A', text: 'Şartname/Projeye Uygunluk', sort: 1 },
        { section: 'A', text: 'Personel/Ekipman Yeterliliği', sort: 2 },
        { section: 'A', text: 'Deneyim ve Referanslar', sort: 3 },
        { section: 'A', text: 'Kalite Yönetim Sistemleri', sort: 4 },
        { section: 'A', text: 'İş Sonu Kontrol ve Teslim', sort: 5 },
        { section: 'B', text: 'Takvim ve Termin Uygunluğu', sort: 1 },
        { section: 'B', text: 'İSG Performansı', sort: 2 },
        { section: 'B', text: 'Maliyet Kontrolü ve Bütçe', sort: 3 },
        { section: 'B', text: 'Koordinasyon ve Raporlama', sort: 4 },
        { section: 'B', text: 'Çevre ve Atık Yönetimi', sort: 5 },
        { section: 'C', text: 'Finansal Güç', sort: 1 },
        { section: 'C', text: 'Fiyat Şeffaflığı ve Rekabet', sort: 2 },
        { section: 'C', text: 'Hukuki Uygunluk', sort: 3 },
        { section: 'C', text: 'Taşeron/Tedarikçi Yönetimi', sort: 4 },
    ],
};

async function main() {
    console.log('📝 Değerlendirme soruları ekleniyor...\n');

    // 1. ScoringType'lar
    console.log('📊 Skor tipleri oluşturuluyor...');
    const scoringTypeMap = {};
    for (const st of SCORING_TYPES) {
        const existing = await prisma.scoringType.findUnique({ where: { code: st.code } });
        if (existing) {
            scoringTypeMap[st.code] = existing.id;
            console.log(`  ✓ Mevcut: ${st.name}`);
        } else {
            const created = await prisma.scoringType.create({ data: st });
            scoringTypeMap[st.code] = created.id;
            console.log(`  ✅ Oluşturuldu: ${st.name}`);
        }
    }

    // 2. Sorular
    console.log('\n❓ Sorular ekleniyor...');
    let totalCreated = 0;
    let totalSkipped = 0;

    for (const [scoringCode, questions] of Object.entries(QUESTIONS)) {
        const scoringTypeId = scoringTypeMap[scoringCode];
        console.log(`\n  📂 ${scoringCode.toUpperCase()} kategorisi:`);

        for (const q of questions) {
            // Aynı text ve scoringType ile soru var mı?
            const existing = await prisma.evaluationQuestion.findFirst({
                where: { text: q.text, scoringTypeId }
            });

            if (existing) {
                totalSkipped++;
                continue;
            }

            await prisma.evaluationQuestion.create({
                data: {
                    text: q.text,
                    type: 'rating',
                    active: true,
                    required: true,
                    section: q.section,
                    sort: q.sort,
                    scoringTypeId
                }
            });
            totalCreated++;
        }
        console.log(`     ✅ ${questions.length} soru işlendi`);
    }

    console.log(`\n🎉 Tamamlandı!`);
    console.log(`   📌 Yeni oluşturulan: ${totalCreated}`);
    console.log(`   ⏭️  Atlanılan (mevcut): ${totalSkipped}`);
}

main()
    .catch(e => {
        console.error('❌ Hata:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
