# SatınalmaPRO - Kurumsal Satınalma Yönetim Sistemi

Kurumsal satınalma süreçlerini yönetmek için geliştirilmiş modern web uygulaması.

## 🚀 Özellikler

- **Talep Yönetimi** - Satınalma taleplerinin oluşturulması ve takibi
- **Sipariş Yönetimi** - Sipariş oluşturma, onay süreçleri
- **Sözleşme Yönetimi** - Tedarikçi sözleşmelerinin yönetimi
- **Fatura Yönetimi** - Fatura girişi, tevkifat hesaplamaları, PDF export
- **Tedarikçi Yönetimi** - Tedarikçi kayıtları ve değerlendirme sistemi
- **Raporlama** - Dashboard ve detaylı raporlar
- **Bildirim Sistemi** - Gerçek zamanlı bildirimler

---

## 📋 Gereksinimler

- **Node.js** 18.x veya üzeri
- **PostgreSQL** 14.x veya üzeri (veya SQLite geliştirme için)
- **npm** veya **yarn** paket yöneticisi

---

## 🛠️ Kurulum Adımları

### 1. Projeyi Klonlayın

```bash
git clone <repository-url>
cd satinalmaproweb
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

### 3. Ortam Değişkenlerini Ayarlayın

`.env.local` dosyası oluşturun:

```env
# Veritabanı Bağlantısı
DATABASE_URL="postgresql://kullanici:sifre@localhost:5432/satinalmapro"

# NextAuth Ayarları
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="guvenli-rastgele-bir-anahtar-32-karakter"

# E-posta Ayarları (isteğe bağlı)
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="email@example.com"
SMTP_PASS="email-sifresi"
SMTP_FROM="noreply@example.com"
```

> **Not:** `NEXTAUTH_SECRET` oluşturmak için: `openssl rand -base64 32`

### 4. Veritabanını Hazırlayın

```bash
# Prisma migration'ları çalıştır
npx prisma migrate dev

# (İsteğe bağlı) Örnek veri yükle
npx prisma db seed
```

### 5. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın.

---

## 🔧 Yapılandırma

### Veritabanı Seçenekleri

**PostgreSQL (Üretim için önerilir):**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/satinalmapro"
```

**SQLite (Geliştirme için):**
```env
DATABASE_URL="file:./dev.db"
```

### E-posta Bildirimleri

E-posta bildirimleri için SMTP ayarlarını yapılandırın. Gmail örneği:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

> Gmail kullanıyorsanız, "App Password" oluşturmanız gerekir.

---

## 📦 Üretim Derleme

```bash
# Production build oluştur
npm run build

# Production sunucusunu başlat
npm run start
```

---

## 🐳 Docker ile Kurulum

```bash
# Docker image oluştur
docker build -t satinalmapro .

# Container başlat
docker run -p 3000:3000 --env-file .env.local satinalmapro
```

---

## 📁 Proje Yapısı

```
satinalmaproweb/
├── src/
│   ├── app/              # Next.js App Router sayfaları
│   │   ├── api/          # API rotaları
│   │   ├── talep/        # Talep modülü
│   │   ├── siparis/      # Sipariş modülü
│   │   ├── sozlesme/     # Sözleşme modülü
│   │   ├── fatura/       # Fatura modülü
│   │   ├── tedarikci/    # Tedarikçi modülü
│   │   ├── toplanti/     # Toplantı modülü
│   │   └── raporlama/    # Raporlama modülü
│   ├── components/       # React bileşenleri
│   │   ├── ui/           # Temel UI bileşenleri
│   │   └── ...           # Modül bileşenleri
│   ├── lib/              # Yardımcı fonksiyonlar
│   │   ├── pdf/          # PDF oluşturma
│   │   ├── prisma.ts     # Veritabanı bağlantısı
│   │   └── auth.ts       # Kimlik doğrulama
│   └── types/            # TypeScript tipleri
├── prisma/
│   └── schema.prisma     # Veritabanı şeması
├── public/               # Statik dosyalar
└── docs/                 # Dokümantasyon
```

---

## 🔐 Varsayılan Giriş Bilgileri

İlk kurulumda oluşturulan admin hesabı:

- **E-posta:** admin@example.com
- **Şifre:** admin123

> ⚠️ **Önemli:** Üretim ortamında bu bilgileri değiştirin!

---

## 🎨 Tema Desteği

Uygulama açık ve koyu tema destekler:

- Navbar'daki **☀️/🌙** ikonuna tıklayarak tema değiştirin
- Tercihleriniz tarayıcıda kaydedilir
- Sistem teması seçeneği mevcuttur

---

## 📄 PDF Export

Fatura detay sayfasında **"PDF İndir"** butonu ile fatura PDF olarak indirilebilir.

---

## 🐛 Sorun Giderme

### Veritabanı bağlantı hatası
```bash
# Prisma client'ı yeniden oluştur
npx prisma generate
```

### Migration hatası
```bash
# Migration'ları sıfırla (DİKKAT: Veri kaybı!)
npx prisma migrate reset
```

### Modül bulunamadı hatası
```bash
# node_modules temizle ve yeniden yükle
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Dokümantasyon

- **Tasarım Sistemi:** `src/design/guide.md`
- **Teknik Standartlar:** `docs/technical-standards.md`

---

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişiklikleri commit edin (`git commit -m 'Yeni özellik eklendi'`)
4. Branch'i push edin (`git push origin feature/yeni-ozellik`)
5. Pull Request açın

---

## 📝 Lisans

Bu proje özel lisans altındadır. Ticari kullanım için iletişime geçin.

---

## 📞 Destek

Sorularınız için: destek@satinalmapro.com
