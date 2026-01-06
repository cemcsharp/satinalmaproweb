import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function upsertCategory(key, name, items) {
  const cat = await prisma.optionCategory.upsert({
    where: { key },
    update: { name },
    create: { key, name },
  });
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    await prisma.optionItem.upsert({
      where: { id: it.id },
      update: { label: it.label, active: true, sort: i + 1, categoryId: cat.id },
      create: { id: it.id, label: it.label, active: true, sort: i + 1, categoryId: cat.id },
    });
  }
}

async function main() {
  // Roles
  const adminRole = await prisma.role.upsert({
    where: { key: "admin" },
    update: {
      name: "Admin",
      permissions: [
        "talep:read", "talep:create", "talep:edit", "talep:delete",
        "siparis:read", "siparis:create", "siparis:edit", "siparis:delete",
        "rfq:read", "rfq:create", "rfq:edit", "rfq:delete",
        "teslimat:read", "teslimat:create", "teslimat:edit", "teslimat:delete",
        "fatura:read", "fatura:create", "fatura:edit", "fatura:delete",
        "sozlesme:read", "sozlesme:create", "sozlesme:edit", "sozlesme:delete",
        "tedarikci:read", "tedarikci:create", "tedarikci:edit", "tedarikci:delete",
        "evaluation:submit",
        "urun:read", "urun:create", "urun:edit", "urun:delete",
        "rapor:read",
        "ayarlar:read", "ayarlar:edit", "user:manage", "role:manage"
      ],
      description: "Tam yetkili yönetici"
    },
    create: {
      key: "admin",
      name: "Admin",
      permissions: [
        "talep:read", "talep:create", "talep:edit", "talep:delete",
        "siparis:read", "siparis:create", "siparis:edit", "siparis:delete",
        "rfq:read", "rfq:create", "rfq:edit", "rfq:delete",
        "teslimat:read", "teslimat:create", "teslimat:edit", "teslimat:delete",
        "fatura:read", "fatura:create", "fatura:edit", "fatura:delete",
        "sozlesme:read", "sozlesme:create", "sozlesme:edit", "sozlesme:delete",
        "tedarikci:read", "tedarikci:create", "tedarikci:edit", "tedarikci:delete",
        "evaluation:submit",
        "urun:read", "urun:create", "urun:edit", "urun:delete",
        "rapor:read",
        "ayarlar:read", "ayarlar:edit", "user:manage", "role:manage"
      ],
      description: "Tam yetkili yönetici"
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { key: "satinalma_muduru" },
    update: {
      name: "Satın Alma Müdürü",
      permissions: [
        "talep:read", "talep:edit", "talep:delete",
        "siparis:read", "siparis:create", "siparis:edit", "siparis:delete",
        "rfq:read", "rfq:create", "rfq:edit", "rfq:delete",
        "teslimat:read", "teslimat:create", "teslimat:edit",
        "fatura:read", "fatura:create", "fatura:edit",
        "sozlesme:read", "sozlesme:create", "sozlesme:edit",
        "tedarikci:read", "tedarikci:create", "tedarikci:edit", "tedarikci:delete",
        "evaluation:submit",
        "urun:read", "urun:create", "urun:edit",
        "rapor:read",
        "ayarlar:read", "ayarlar:edit", "user:manage"
      ],
      description: "Satın alma departman yöneticisi"
    },
    create: {
      key: "satinalma_muduru",
      name: "Satın Alma Müdürü",
      permissions: [
        "talep:read", "talep:edit", "talep:delete",
        "siparis:read", "siparis:create", "siparis:edit", "siparis:delete",
        "rfq:read", "rfq:create", "rfq:edit", "rfq:delete",
        "teslimat:read", "teslimat:create", "teslimat:edit",
        "fatura:read", "fatura:create", "fatura:edit",
        "sozlesme:read", "sozlesme:create", "sozlesme:edit",
        "tedarikci:read", "tedarikci:create", "tedarikci:edit", "tedarikci:delete",
        "evaluation:submit",
        "urun:read", "urun:create", "urun:edit",
        "rapor:read",
        "ayarlar:read", "ayarlar:edit", "user:manage"
      ],
      description: "Satın alma departman yöneticisi"
    },
  });

  const unitOfficialRole = await prisma.role.upsert({
    where: { key: "birim_yetkilisi" },
    update: {
      name: "Birim Yetkilisi",
      permissions: [
        "talep:create", "talep:read",
        "siparis:read",
        "teslimat:read",
        "rapor:read"
      ],
      description: "Birim bazlı talepleri yöneten yetkili"
    },
    create: {
      key: "birim_yetkilisi",
      name: "Birim Yetkilisi",
      permissions: [
        "talep:create", "talep:read",
        "siparis:read",
        "teslimat:read",
        "rapor:read"
      ],
      description: "Birim bazlı talepleri yöneten yetkili"
    },
  });

  const evaluatorRole = await prisma.role.upsert({
    where: { key: "birim_evaluator" },
    update: {
      name: "Birim Değerlendiricisi",
      permissions: [
        "talep:read",
        "siparis:read",
        "teslimat:read",
        "evaluation:submit"
      ],
      description: "Sadece tedarikçi değerlendirmesi yapabilir"
    },
    create: {
      key: "birim_evaluator",
      name: "Birim Değerlendiricisi",
      permissions: [
        "talep:read",
        "siparis:read",
        "teslimat:read",
        "evaluation:submit"
      ],
      description: "Sadece tedarikçi değerlendirmesi yapabilir"
    },
  });

  const warehouseRole = await prisma.role.upsert({
    where: { key: "depo_gorevlisi" },
    update: {
      name: "Depo Görevlisi",
      permissions: ["teslimat:read", "teslimat:create", "teslimat:edit"],
      description: "Teslimat ve kabul işlemlerini yöneten personel"
    },
    create: {
      key: "depo_gorevlisi",
      name: "Depo Görevlisi",
      permissions: ["teslimat:read", "teslimat:create", "teslimat:edit"],
      description: "Teslimat ve kabul işlemlerini yöneten personel"
    },
  });

  const userRole = await prisma.role.upsert({
    where: { key: "user" },
    update: { name: "Kullanıcı", permissions: ["talep:create", "talep:read"], description: "Standart kullanıcı" },
    create: { key: "user", name: "Kullanıcı", permissions: ["talep:create", "talep:read"], description: "Standart kullanıcı" },
  });

  const supplierRole = await prisma.role.upsert({
    where: { key: "supplier" },
    update: {
      name: "Tedarikçi",
      permissions: ["rfq:read", "offer:submit", "portal:access"],
      description: "Dış tedarikçi portal erişimi"
    },
    create: {
      key: "supplier",
      name: "Tedarikçi",
      permissions: ["rfq:read", "offer:submit", "portal:access"],
      description: "Dış tedarikçi portal erişimi"
    },
  });

  // Ensure demo user exists
  try {
    const demoUsername = "admin";
    const demoEmail = "admin@sirket.com";
    const demoPassword = "admin1234";
    const demoHash = await bcrypt.hash(demoPassword, 10);
    const demoUser = await prisma.user.upsert({
      where: { username: demoUsername },
      update: { email: demoEmail, passwordHash: demoHash, role: "admin", roleId: adminRole.id, isActive: true },
      create: { username: demoUsername, email: demoEmail, passwordHash: demoHash, role: "admin", roleId: adminRole.id, isActive: true },
    });
  } catch (e) {
    console.warn("User creation skipped due to unique constraint or other error:", e.message);
  }

  await upsertCategory("ilgiliKisi", "İlgili Kişi", [
    { id: "p1", label: "Ali Yılmaz" },
    { id: "p2", label: "Ayşe Demir" },
  ]);
  await upsertCategory("birim", "Talep Eden Birim", [
    { id: "b1", label: "Satın Alma" },
    { id: "b2", label: "Üretim" },
  ]);
  await upsertCategory("durum", "Talep/Sipariş Durumu", [
    { id: "d1", label: "Taslak" },
    { id: "d2", label: "Onaylandı" },
  ]);
  await upsertCategory("paraBirimi", "Para Birimi", [
    { id: "c1", label: "TRY" },
    { id: "c2", label: "USD" },
    { id: "c3", label: "EUR" },
  ]);
  await upsertCategory("birimTipi", "Ürün Birimi", [
    { id: "u1", label: "Adet" },
    { id: "u2", label: "Kg" },
    { id: "u3", label: "Paket" },
  ]);
  await upsertCategory("siparisDurumu", "Sipariş Durumu", [
    { id: "s1", label: "Taslak" },
    { id: "s2", label: "Onaylandı" },
    { id: "s3", label: "Faturalandı" },
    { id: "s4", label: "Tamamlandı" },
  ]);
  await upsertCategory("alimYontemi", "Alım Yöntemi", [
    { id: "m1", label: "Doğrudan Temin" },
    { id: "m2", label: "İhale" },
  ]);
  await upsertCategory("yonetmelikMaddesi", "Yönetmelik Maddesi", [
    { id: "y1", label: "Madde 22" },
    { id: "y2", label: "Madde 19" },
  ]);
  await upsertCategory("tedarikci", "Tedarikçi", [
    { id: "sup1", label: "ABC Tedarik" },
    { id: "sup2", label: "XYZ Tedarik" },
    { id: "sup3", label: "Kuzey Lojistik" },
    { id: "sup4", label: "Delta Endüstri" },
  ]);
  await upsertCategory("firma", "Firma", [
    { id: "co1", label: "ABC Holding" },
    { id: "co2", label: "XYZ A.Ş." },
    { id: "co3", label: "Kuzey Grup" },
    { id: "co4", label: "Delta Teknoloji" },
  ]);
  try {
    // Suppliers & Companies
    await prisma.supplier.upsert({
      where: { id: "sup1" },
      update: { name: "ABC Tedarik", taxId: "1234567890", email: "info@abctedarik.com", phone: "+90 212 000 00 01", address: "İstanbul", website: "https://abctedarik.com", contactName: "Ali Yılmaz" },
      create: { id: "sup1", name: "ABC Tedarik", taxId: "1234567890", email: "info@abctedarik.com", phone: "+90 212 000 00 01", address: "İstanbul", website: "https://abctedarik.com", contactName: "Ali Yılmaz" },
    });
    await prisma.supplier.upsert({
      where: { id: "sup2" },
      update: { name: "XYZ Tedarik", taxId: "2234567890", email: "destek@xyz.com", phone: "+90 212 000 00 02", address: "Ankara", website: "https://xyz.com", contactName: "Ayşe Demir" },
      create: { id: "sup2", name: "XYZ Tedarik", taxId: "2234567890", email: "destek@xyz.com", phone: "+90 212 000 00 02", address: "Ankara", website: "https://xyz.com", contactName: "Ayşe Demir" },
    });
    await prisma.supplier.upsert({
      where: { id: "sup3" },
      update: { name: "Kuzey Lojistik", taxId: "3234567890", email: "iletisim@kuzeylojistik.com", phone: "+90 216 000 00 03", address: "Kocaeli", website: "https://kuzeylojistik.com", contactName: "Mehmet Kaya" },
      create: { id: "sup3", name: "Kuzey Lojistik", taxId: "3234567890", email: "iletisim@kuzeylojistik.com", phone: "+90 216 000 00 03", address: "Kocaeli", website: "https://kuzeylojistik.com", contactName: "Mehmet Kaya" },
    });
    await prisma.supplier.upsert({
      where: { id: "sup4" },
      update: { name: "Delta Endüstri", taxId: "4234567890", email: "sales@deltaendustri.com", phone: "+90 224 000 00 04", address: "Bursa", website: "https://deltaendustri.com", contactName: "Zeynep Çelik" },
      create: { id: "sup4", name: "Delta Endüstri", taxId: "4234567890", email: "sales@deltaendustri.com", phone: "+90 224 000 00 04", address: "Bursa", website: "https://deltaendustri.com", contactName: "Zeynep Çelik" },
    });

    await prisma.company.upsert({ where: { id: "co1" }, update: { name: "ABC Holding", taxId: "1111111110", address: "İstanbul" }, create: { id: "co1", name: "ABC Holding", taxId: "1111111110", address: "İstanbul" } });
    await prisma.company.upsert({ where: { id: "co2" }, update: { name: "XYZ A.Ş.", taxId: "2222222220", address: "Ankara" }, create: { id: "co2", name: "XYZ A.Ş.", taxId: "2222222220", address: "Ankara" } });
    await prisma.company.upsert({ where: { id: "co3" }, update: { name: "Kuzey Grup", taxId: "3333333330", address: "Kocaeli" }, create: { id: "co3", name: "Kuzey Grup", taxId: "3333333330", address: "Kocaeli" } });
    await prisma.company.upsert({ where: { id: "co4" }, update: { name: "Delta Teknoloji", taxId: "4444444440", address: "Bursa" }, create: { id: "co4", name: "Delta Teknoloji", taxId: "4444444440", address: "Bursa" } });

    // --- Supplier Evaluation: Scoring Types and Category Questions (idempotent) ---
    async function ensureScoringType(code, name) {
      const st = await prisma.scoringType.upsert({
        where: { code },
        update: { name, kind: "rating", scaleMin: 1, scaleMax: 5, step: 1, active: true },
        create: { code, name, kind: "rating", scaleMin: 1, scaleMax: 5, step: 1, active: true },
      });
      return st;
    }
    async function ensureQuestion(typeCode, q, sortMap) {
      const st = await prisma.scoringType.findUnique({ where: { code: typeCode } });
      if (!st) throw new Error(`Missing scoringType ${typeCode}`);
      const existing = await prisma.evaluationQuestion.findFirst({ where: { text: q.text, section: q.section } });
      if (existing) {
        // Ensure linkage to scoring type
        if (!existing.scoringTypeId) {
          await prisma.evaluationQuestion.update({ where: { id: existing.id }, data: { scoringTypeId: st.id } });
        }
        return existing.id;
      }
      sortMap[q.section] = (sortMap[q.section] || 0) + 1;
      const created = await prisma.evaluationQuestion.create({
        data: { text: q.text, type: q.type, active: true, required: false, section: q.section, sort: sortMap[q.section], scoringTypeId: st.id },
      });
      return created.id;
    }

    const categories = [
      {
        code: "malzeme",
        name: "Malzeme Alımları",
        questions: [
          { section: "A", text: "Teknik Şartnameye Uygunluk", type: "rating" },
          { section: "A", text: "Red/İade Oranı", type: "rating" },
          { section: "A", text: "Garanti ve Satış Sonrası Hizmet", type: "rating" },
          { section: "A", text: "Sertifikasyon ve Belgelendirme", type: "rating" },
          { section: "A", text: "Stok Sürekliliği", type: "rating" },
          { section: "B", text: "Fiyat Düzeyi", type: "rating" },
          { section: "B", text: "Fiyat İstikrarı ve Şeffaflığı", type: "rating" },
          { section: "B", text: "Ödeme Koşulları ve Vade", type: "rating" },
          { section: "B", text: "Toplu Alım/İndirim Esnekliği", type: "rating" },
          { section: "C", text: "Zamanında Teslimat", type: "rating" },
          { section: "C", text: "Miktara Uygunluk", type: "rating" },
          { section: "C", text: "Ambalajlama ve Hasarsız Teslimat", type: "rating" },
          { section: "C", text: "Lojistik ve Takip", type: "rating" },
        ],
      },
      {
        code: "hizmet",
        name: "Hizmet Alımları",
        questions: [
          { section: "A", text: "Hizmet Şartnamesine Uygunluk", type: "rating" },
          { section: "A", text: "Personel Yeterliliği ve Deneyimi", type: "rating" },
          { section: "A", text: "Ekipman/Malzeme Kalitesi", type: "rating" },
          { section: "A", text: "Hata/Şikayet Oranı", type: "rating" },
          { section: "A", text: "Sorun Çözme Hızı ve Etkinliği", type: "rating" },
          { section: "B", text: "Süre Taahhütlerine Uygunluk", type: "rating" },
          { section: "B", text: "Personel Devamlılığı ve Hızı", type: "rating" },
          { section: "B", text: "Esneklik ve Acil Taleplere Cevap", type: "rating" },
          { section: "B", text: "İletişim ve Raporlama Şeffaflığı", type: "rating" },
          { section: "C", text: "Fiyat Rekabetçiliği ve Şeffaflığı", type: "rating" },
          { section: "C", text: "Ödeme Koşullarına Uygunluk", type: "rating" },
          { section: "C", text: "Kurumsal Yapı ve Belgelendirme", type: "rating" },
          { section: "C", text: "İSG Uyumu", type: "rating" },
          { section: "C", text: "Referanslar ve Pazarda İtibar", type: "rating" },
        ],
      },
      {
        code: "danismanlik",
        name: "Danışmanlık Alımları",
        questions: [
          { section: "A", text: "Uzmanlık Deneyimi", type: "rating" },
          { section: "A", text: "Proje Ekibi Nitelikleri", type: "rating" },
          { section: "A", text: "Metodoloji ve Yaklaşım", type: "rating" },
          { section: "A", text: "Gizlilik ve Fikri Mülkiyet", type: "rating" },
          { section: "A", text: "Referanslar ve Akademik İlişkiler", type: "rating" },
          { section: "B", text: "Takvim ve Terminlere Uygunluk", type: "rating" },
          { section: "B", text: "İletişim ve Raporlama", type: "rating" },
          { section: "B", text: "İşbirliği ve Koordinasyon", type: "rating" },
          { section: "B", text: "Çıktıların Uygulanabilirliği", type: "rating" },
          { section: "C", text: "Maliyet Rekabetçiliği ve Kapsamı", type: "rating" },
          { section: "C", text: "Ödeme Planı ve Esneklik", type: "rating" },
          { section: "C", text: "Süre/Bütçe İçinde Kalma", type: "rating" },
          { section: "C", text: "Finansal İstikrar", type: "rating" },
        ],
      },
      {
        code: "bakim",
        name: "Bakım Onarım",
        questions: [
          { section: "A", text: "Teknik Uzmanlık ve Sertifikasyon", type: "rating" },
          { section: "A", text: "Arıza Tespit ve Onarım Başarısı", type: "rating" },
          { section: "A", text: "Yedek Parça/Malzeme Kalitesi", type: "rating" },
          { section: "A", text: "İşçilik Kalitesi ve Garanti", type: "rating" },
          { section: "A", text: "Önleyici Bakım Yeterliliği", type: "rating" },
          { section: "B", text: "Acil Durum Müdahale Hızı", type: "rating" },
          { section: "B", text: "Taahhüt Süresi Uygunluğu", type: "rating" },
          { section: "B", text: "İSG Uygulamaları", type: "rating" },
          { section: "B", text: "Alan Düzeni ve Temizlik", type: "rating" },
          { section: "B", text: "İletişim ve Raporlama", type: "rating" },
          { section: "C", text: "Fiyatlandırma Şeffaflığı", type: "rating" },
          { section: "C", text: "Maliyet Sapması", type: "rating" },
          { section: "C", text: "Kapasite (Personel/Ekipman)", type: "rating" },
          { section: "C", text: "Finansal İstikrar ve Referanslar", type: "rating" },
        ],
      },
      {
        code: "insaat",
        name: "İnşaat İşleri",
        questions: [
          { section: "A", text: "Şartname/Projeye Uygunluk", type: "rating" },
          { section: "A", text: "Personel/Ekipman Yeterliliği", type: "rating" },
          { section: "A", text: "Deneyim ve Referanslar", type: "rating" },
          { section: "A", text: "Kalite Yönetim Sistemleri", type: "rating" },
          { section: "A", text: "İş Sonu Kontrol ve Teslim", type: "rating" },
          { section: "B", text: "Takvim ve Termin Uygunluğu", type: "rating" },
          { section: "B", text: "İSG Performansı", type: "rating" },
          { section: "B", text: "Maliyet Kontrolü ve Bütçe", type: "rating" },
          { section: "B", text: "Koordinasyon ve Raporlama", type: "rating" },
          { section: "B", text: "Çevre ve Atık Yönetimi", type: "rating" },
          { section: "C", text: "Finansal Güç", type: "rating" },
          { section: "C", text: "Fiyat Şeffaflığı ve Rekabet", type: "rating" },
          { section: "C", text: "Hukuki Uygunluk", type: "rating" },
          { section: "C", text: "Taşeron/Tedarikçi Yönetimi", type: "rating" },
        ],
      },
    ];

    for (const cat of categories) {
      await ensureScoringType(cat.code, cat.name);
      const sortMap = { A: 0, B: 0, C: 0 };
      for (const q of cat.questions) {
        await ensureQuestion(cat.code, q, sortMap);
      }
      console.log(`Ensured ${cat.questions.length} questions for ${cat.code}.`);
    }

    const withholdingJobTypes = [
      { code: "201", label: "Yapım işleri ve birlikte mühendislik/mimarlık/etüt-proje", ratio: "4/10" },
      { code: "202", label: "Etüt, plan-proje, danışmanlık, denetim ve benzeri hizmetler", ratio: "9/10" },
      { code: "203", label: "Makine/teçhizat/demirbaş/taşınmaz tadil, bakım ve onarım", ratio: "7/10" },
      { code: "204", label: "Yemek servis hizmeti", ratio: "5/10" },
      { code: "205", label: "Organizasyon hizmetleri", ratio: "9/10" },
      { code: "206", label: "İşgücü temin hizmetleri", ratio: "9/10" },
      { code: "207", label: "Özel güvenlik hizmeti", ratio: "9/10" },
      { code: "208", label: "Yapı denetim hizmetleri", ratio: "9/10" },
      { code: "209", label: "Fason tekstil/konfeksiyon/çanta/ayakkabı işleri ve aracılık", ratio: "7/10" },
      { code: "210", label: "Turistik mağazalara müşteri bulma/götürme", ratio: "9/10" },
      { code: "211", label: "Spor kulüplerinin yayın, reklam ve isim hakkı işlemleri", ratio: "9/10" },
      { code: "212", label: "Temizlik hizmeti", ratio: "9/10" },
      { code: "213", label: "Servis taşımacılığı hizmeti", ratio: "5/10" },
      { code: "214", label: "Her türlü baskı ve basım hizmetleri", ratio: "7/10" },
      { code: "215", label: "Cetvellerdeki idare/kurum/kuruluşlara yapılan diğer hizmetler", ratio: "5/10" },
      { code: "217", label: "Hurda metalden elde edilen külçe teslimleri", ratio: "7/10" },
      { code: "218", label: "Hurda metal dışı bakır/çinko/alüminyum külçe teslimleri", ratio: "7/10" },
      { code: "219", label: "Bakır/çinko/alüminyum/kurşun ürün teslimleri", ratio: "7/10" },
      { code: "220", label: "İstisnadan vazgeçenlerin hurda ve atık teslimi", ratio: "7/10" },
      { code: "221", label: "Hurda ve atıklardan elde edilen hammadde teslimi", ratio: "9/10" },
      { code: "222", label: "Pamuk, tiftik, yün, yapağı ve ham post/deri teslimleri", ratio: "9/10" },
      { code: "223", label: "Ağaç ve orman ürünleri teslimi", ratio: "5/10" },
      { code: "224", label: "Yük taşımacılığı hizmeti", ratio: "2/10" },
      { code: "225", label: "Ticari reklam hizmetleri", ratio: "9/10" },
      { code: "226", label: "Diğer teslimler", ratio: "2/10" },
      { code: "227", label: "Demir-çelik ürün teslimi", ratio: "5/10" },
      { code: "228", label: "Diğerleri", ratio: "3/10" },
      { code: "229", label: "Diğerleri", ratio: "4/10" },
      { code: "230", label: "Diğerleri", ratio: "5/10" },
      { code: "231", label: "Diğerleri", ratio: "7/10" },
      { code: "232", label: "Diğerleri", ratio: "9/10" },
    ];
    for (let i = 0; i < withholdingJobTypes.length; i++) {
      const jt = withholdingJobTypes[i];
      await prisma.withholdingJobType.upsert({
        where: { code: jt.code },
        update: { label: jt.label, ratio: jt.ratio, active: true, sort: i + 1 },
        create: { code: jt.code, label: jt.label, ratio: jt.ratio, active: true, sort: i + 1 },
      });
    }

    // --- Demo transactional data for lists ---
    // Request
    const req = await prisma.request.upsert({
      where: { barcode: "REQ-2025-001" },
      update: {},
      create: {
        barcode: "REQ-2025-001",
        subject: "Demo Talep",
        budget: "10000",
        relatedPersonId: "p1",
        unitId: "b1",
        statusId: "d1",
        currencyId: "c1",
      },
    });
    // Request items
    const existingItem = await prisma.requestItem.findFirst({ where: { requestId: req.id } });
    if (!existingItem) {
      await prisma.requestItem.create({
        data: {
          requestId: req.id,
          name: "Demo Ürün",
          quantity: "5",
          unitId: "u1",
        },
      });
    }

    // Order
    const ord = await prisma.order.upsert({
      where: { barcode: "ORD-2025-001" },
      update: {},
      create: {
        barcode: "ORD-2025-001",
        requestId: req.id,
        statusId: "s1",
        methodId: "m1",
        regulationId: "y1",
        currencyId: "c1",
        supplierId: "sup1",
        companyId: "co1",
        realizedTotal: "8500",
      },
    });

    // Contract
    const existingContract = await prisma.contract.findFirst({ where: { orderId: ord.id } });
    if (!existingContract) {
      await prisma.contract.create({
        data: {
          number: "S-2025-DEMO",
          title: "Sipariş ORD-2025-001 Sözleşmesi",
          parties: "ABC Holding; ABC Tedarik",
          startDate: new Date(),
          status: "Taslak",
          orderId: ord.id,
          type: "Satın Alma",
          template: "standart",
        },
      });
    }
  } catch (e) { console.warn("Seed data incomplete:", e.message); }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
