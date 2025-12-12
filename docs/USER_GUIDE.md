# SatınalmaPRO Kullanıcı Kılavuzu

## İçindekiler

1. [Giriş ve İlk Adımlar](#giriş-ve-ilk-adımlar)
2. [Talep Yönetimi](#talep-yönetimi)
3. [Sipariş Yönetimi](#sipariş-yönetimi)
4. [Teslimat Yönetimi](#teslimat-yönetimi)
5. [Fatura Yönetimi](#fatura-yönetimi)
6. [Sözleşme Yönetimi](#sözleşme-yönetimi)
7. [Tedarikçi Yönetimi](#tedarikçi-yönetimi)
8. [Raporlama](#raporlama)
9. [Ayarlar](#ayarlar)
10. [SSS (Sıkça Sorulan Sorular)](#sss)

---

## Giriş ve İlk Adımlar

### Sisteme Giriş
1. Tarayıcınızda sistem adresini açın
2. Kullanıcı adı ve şifrenizi girin
3. "Giriş Yap" butonuna tıklayın

### Dashboard (Ana Sayfa)
Giriş yaptıktan sonra dashboard'da şunları göreceksiniz:
- Özet istatistikler (talep, sipariş, fatura sayıları)
- Döviz kurları
- Hızlı erişim menüsü

---

## Talep Yönetimi

### Yeni Talep Oluşturma
1. Sol menüden "Talep" → "Talep Oluştur" seçin
2. Talep konusunu yazın
3. Talep kalemlerini ekleyin:
   - Ürün/hizmet adı
   - Miktar
   - Birim
   - Tahmini fiyat
4. "Kaydet" butonuna tıklayın

### Talep Listesi
- Sol menüden "Talep" → "Talep Listesi"
- Filtreleme: Durum, tarih, sorumlu
- Arama: Barkod veya konu ile arayın

### Talep Durumları
| Durum | Anlam |
|-------|-------|
| Beklemede | Onay bekliyor |
| Onaylandı | Siparişe dönüştürülebilir |
| Reddedildi | Talep reddedildi |
| Tamamlandı | Süreç tamamlandı |

---

## Sipariş Yönetimi

### Yeni Sipariş Oluşturma
1. "Sipariş" → "Sipariş Oluştur"
2. Tedarikçi seçin
3. PO numarası girin
4. Sipariş kalemlerini ekleyin
5. Tahmini teslimat tarihi seçin
6. "Kaydet"

### Sipariş Listesi
- Duruma göre filtreleyin
- Tedarikçiye göre arayın
- Detay için satıra tıklayın

### Teslimat Linki Gönderme
1. Sipariş detay sayfasını açın
2. "Teslimat Linki Gönder" butonuna tıklayın
3. Tedarikçinin e-postasına link gönderilir
4. Tedarikçi bu link üzerinden teslimat bildirimini yapar

---

## Teslimat Yönetimi

### Bekleyen Teslimatlar
- "Teslimat" → "Bekleyen Teslimatlar"
- Henüz teslim edilmemiş siparişler

### Teslimat Onayı
1. "Teslimat" → "Onay Bekleyenler"
2. Teslimat kaydını inceleyin
3. Miktarları kontrol edin
4. "Onayla" veya "Reddet"

### Teslimat Geçmişi
- Tamamlanan tüm teslimatlar
- Tarih aralığı ile filtreleme

---

## Fatura Yönetimi

### Yeni Fatura Oluşturma
1. "Fatura" → "Fatura Oluştur"
2. İlgili siparişi seçin
3. Fatura bilgilerini girin:
   - Fatura no
   - Fatura tarihi
   - KDV oranı
   - Tevkifat (varsa)
4. "Kaydet"

### Fatura Listesi
- KDV ve tevkifat toplamları görünür
- Excel'e aktarma mümkün

---

## Sözleşme Yönetimi

### Yeni Sözleşme
1. "Sözleşme" → "Sözleşme Oluştur"
2. Sözleşme bilgilerini girin:
   - Sözleşme no
   - Taraflar
   - Başlangıç/bitiş tarihi
   - Tutar
3. Ek dosyaları yükleyin
4. "Kaydet"

### Sözleşme Takibi
- Sona erme uyarıları
- Durum takibi
- Versiyon geçmişi

---

## Tedarikçi Yönetimi

### Yeni Tedarikçi
1. "Tedarikçi" → "Tedarikçi Oluştur"
2. Firma bilgilerini girin
3. İletişim bilgilerini ekleyin
4. "Kaydet"

### Tedarikçi Değerlendirme
1. "Tedarikçi" → "Tedarikçi Değerlendirme"
2. Değerlendirilecek siparişi seçin
3. Kategorilere puan verin:
   - Kalite
   - Teslimat
   - Fiyat
   - İletişim
4. "Gönder"

### Değerlendirme Raporları
- Tedarikçi bazlı ortalama puanlar
- Trend grafikleri
- Karşılaştırma raporları

---

## Raporlama

### Dashboard
- Özet istatistikler
- Aylık/yıllık karşılaştırmalar
- Grafikler

### Detaylı Raporlar
- Talep raporları
- Sipariş raporları
- Tedarikçi performans raporları
- Excel'e aktarma

---

## Ayarlar

### Kullanıcı Yönetimi
- Yeni kullanıcı ekleme
- Rol atama
- Şifre sıfırlama

### Rol Yönetimi
- Yeni rol oluşturma
- İzin tanımlama
- Rol atama

### Sistem Ayarları
- Dropdown seçenekleri
- SMTP ayarları
- Tevkifat oranları
- Değerlendirme kriterleri

### Sistem Logları
- Kim ne yaptı?
- İşlem geçmişi
- Filtreleme

---

## SSS

### 1. Şifremi unuttum, ne yapmalıyım?
Giriş sayfasındaki "Şifremi Unuttum" linkine tıklayın. E-postanıza şifre sıfırlama linki gönderilecektir.

### 2. Talep nasıl siparişe dönüştürülür?
Önce talebin "Onaylandı" durumuna gelmesi gerekir. Ardından talep detay sayfasından "Siparişe Dönüştür" butonunu kullanın.

### 3. Tedarikçi teslimat bildirimini nasıl yapar?
Sipariş oluşturulduktan sonra tedarikçiye e-posta ile özel bir link gönderilir. Tedarikçi bu link üzerinden teslimat bilgilerini girer.

### 4. Faturada tevkifat nasıl uygulanır?
Fatura oluştururken "Tevkifat" alanından uygun oranı seçin. Sistem otomatik hesaplama yapar.

### 5. Kullanıcı izinlerini nasıl değiştiririm?
"Ayarlar" → "Roller" bölümünden ilgili rolün izinlerini düzenleyebilirsiniz.

### 6. Verileri Excel'e nasıl aktarırım?
Liste sayfalarında "Excel'e Aktar" butonunu kullanın.

---

## Destek

Sorularınız için IT departmanı ile iletişime geçin.
