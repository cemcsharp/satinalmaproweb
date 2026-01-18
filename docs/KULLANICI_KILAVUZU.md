# satinalma.app - Kullanıcı Kılavuzu

## 📋 İçindekiler
1. [Giriş](#giriş)
2. [Temel Modüller](#temel-modüller)
3. [Satınalma Döngüsü](#satınalma-döngüsü)
4. [Yönetim Paneli](#yönetim-paneli)

---

## Giriş

**satinalma.app**, kurumsal satınalma süreçlerini dijitalleştiren ve otomatikleştiren bir platformdur.

### Kullanıcı Türleri
| Rol | Açıklama |
|-----|----------|
| **Admin** | Tüm sistem ayarlarına erişim |
| **Satınalma Uzmanı** | Talep, RFQ, sipariş yönetimi |
| **Onaylayıcı** | Talep ve sipariş onaylama |
| **Tedarikçi** | Teklif verme ve sipariş takibi |

---

## Temel Modüller

### 1. Talep Yönetimi (`/talep`)
- **Yeni Talep** `/talep/olustur`: İhtiyaç bildirimi oluşturma
- **Talep Listesi** `/talep/liste`: Tüm talepleri görüntüleme ve filtreleme
- **Talep Detay**: Onay durumu, kalemler, ek dosyalar

### 2. Teklif Toplama (RFQ) (`/rfq`)
- **RFQ Oluştur** `/rfq/olustur`: Onaylanan taleplerden teklif talebi oluşturma
- **RFQ Listesi** `/rfq/liste`: Aktif ve kapanan teklifleri izleme
- **Teklif Karşılaştırma**: Matris görünümde teklifleri kıyaslama

### 3. Sipariş Yönetimi (`/siparis`)
- **Sipariş Listesi** `/siparis/liste`: Tüm siparişleri görüntüleme
- **Sipariş Detay**: Kalem bazlı takip, teslimat durumu

### 4. Fatura (`/fatura`)
- **Fatura Listesi** `/fatura/liste`: Bekleyen ve ödenen faturalar
- **Fatura Oluştur** `/fatura/olustur`: Manuel fatura kaydı

### 5. Tedarikçi Havuzu (`/tedarikci`)
- **Tedarikçi Listesi** `/tedarikci/liste`: Kayıtlı tedarikçiler
- **Değerlendirme**: Performans puanları ve geçmiş

### 6. Sözleşmeler (`/finans/sozlesmeler`)
- **Sözleşme Listesi**: Aktif sözleşmeleri görüntüleme
- **Yeni Sözleşme** `/finans/sozlesmeler/olustur`: Sözleşme kaydı

---

## Satınalma Döngüsü

```
┌─────────┐    ┌─────────┐    ┌──────────┐    ┌──────────┐    ┌─────────┐
│  Talep  │ → │  Onay   │ → │   RFQ    │ → │ Sipariş  │ → │ Teslimat│
└─────────┘    └─────────┘    └──────────┘    └──────────┘    └─────────┘
                                   ↓
                             ┌──────────┐
                             │  Teklif  │ (Tedarikçiler)
                             └──────────┘
```

### Adım Adım:
1. **Talep Oluştur**: Departman ihtiyacını sisteme gir
2. **Onay Al**: Yönetici onayı bekle
3. **RFQ Gönder**: Tedarikçilere teklif daveti gönder
4. **Teklifleri Karşılaştır**: Fiyat, teslimat, kalite kıyasla
5. **Sipariş Ver**: Kazanan teklifi siparişe dönüştür
6. **Teslimat Takibi**: Mal kabulü ve fatura eşleştirme

---

## Yönetim Paneli (`/admin`)

### Kullanıcı Yönetimi
- **Kullanıcılar** `/admin/kullanicilar`: Kullanıcı ekleme/düzenleme
- **Roller** `/admin/roller`: Yetki tanımlama

### Sistem Ayarları
- **Genel Ayarlar** `/admin/genel`: Şirket bilgileri, e-posta
- **Departmanlar** `/admin/departmanlar`: Departman yapısı

---

## Kısayollar

| Kısayol | İşlev |
|---------|-------|
| `Ctrl+K` | Hızlı arama |
| `N` | Yeni talep |
| `?` | Yardım |

---

## Destek

Sorularınız için: **destek@satinalma.app**
