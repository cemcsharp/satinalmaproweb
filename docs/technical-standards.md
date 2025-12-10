# Satın Alma Pro – Teknik Standartlar ve Uygulama Kılavuzu

Bu doküman, sistem genelinde tutarlı kullanıcı deneyimi, performans, güvenlik, hata yönetimi ve API standartlarının uygulanmasını tanımlar.

## 1) Kullanıcı Arayüzü (Tasarım Sistemi)
- Ortak tasarım dili: `src/design/guide.md` ve `src/app/globals.css` tasarım token’ları.
- Bileşen kullanımı: Formlar, kartlar, butonlar ve tablolar için kılavuzda belirtilen sınıflar ve tema değişkenleri.
- Erişilebilirlik: Min. 4.5:1 kontrast, odak halkası (`focus-ring`), placeholder okunabilirliği.
- Tutarlılık: Kenarlıklar `border-[var(--border)]`, tablolar `--table-border`.

## 2) İşlevsellik (Tutarlı Deneyim)
- Form doğrulama:
  - İstemci: HTML5 `required`, `type` ve pattern ile temel doğrulama.
  - Sunucu: API/Action tarafında şema tabanlı doğrulama (TypeScript tipleri; gerekirse `zod` önerilir).
  - Hata mesajları: Tutarlı, kısa ve eylem odaklı; toast + inline uyarı kombinasyonu.
- Form davranışları: Tüm oluştur/düzenle akışlarında aynı odak, hata gösterimi ve başarı bildirimi.
- Tablo etkileşimleri: Satır hover, zebra opsiyonel; düzenlemeye uygun hücre stilleri.

## 3) Performans
- Performans bütçeleri (hedefler):
  - İlk içerik boyaması (LCP): < 2.5s (masaüstü), < 3.5s (mobil)
  - Etkileşime hazır olma (TTI): < 2s
  - Form etkileşim gecikmesi: < 100ms
- Next.js uygulama pratikleri:
  - Sunucu tarafı veri erişiminde cache ve ISR/SSG uygunsa kullanın.
  - Büyük listelerde sanallaştırma ve sayfalama (pagination).
  - Gereksiz render’ları azaltmak için memoizasyon ve state kapsamını dar tutun.
  - Statik assetler: Optimize görseller, lazy-load uygun alanlarda.

## 4) Güvenlik
- Kimlik doğrulama: `next-auth` ile tüm modüllerde aynı yaklaşım.
  - Sunucu bileşenlerinde `getServerSession(authOptions)`.
  - API route’larında erişim kontrolü: rol bazlı yetkilendirme (`src/lib/roles.ts`).
- Oran sınırlama: `src/lib/rateLimiter.ts` gerekli noktalar için uygulanmalı.
- Girdi güvenliği: Sunucu doğrulaması ve tip güvenliği; SQL enjeksiyonuna karşı Prisma’nın güvenli sorguları.
- Gizli bilgiler: `.env` yönetimi, token ve anahtarların sızmaması; prod’da güvenli cookie ayarları.

## 5) Hata Yönetimi ve Loglama
- Hata mesajları: Kullanıcıya sade ve yol gösterici; `toast-*` semantic kenarlıklarla tutarlı.
- Loglama: Sunucu tarafında anlamlı loglar; hata ayrıntıları geliştirici konsoluna, kullanıcıya genel mesaj.
- Tutarlı API hata formatı:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Alan doğrulaması başarısız",
    "details": { "field": "name" }
  }
}
```

## 6) API Standartları
- İletişim protokolü: JSON; tutarlı tarih biçimi ISO8601.
- Versiyonlama: `/api/v1/...` şemasına hazırlıklı yapı.
- Ortak yanıt zarfı:
```json
{ "success": true, "data": { /* payload */ } }
```
- Sayfalama: `page`, `pageSize`, `total`, `items` alanları.
- Hata formatı: Bölüm 5’teki şablon.

## Uygulama Notları
- Tema ve tasarım: `globals.css` değişkenleri ve `@layer base` ile sistem geneline uygulanır.
- Form kontrastları: `--input-*` değişkenleri ile hover/focus durumları tutarlı.
- Yetki ve oturum: `src/app/middleware.ts` ve `src/lib/authOptions.ts` referans alınmalıdır.
- Performans: Büyük veri listelerinde sayfalama ve lazy stratejileri zorunlu.

## Kabul Kriterleri (Definition of Done)
- Tasarım kılavuzuna uyumlu arayüz.
- İstemci ve sunucu doğrulaması kapsayıcı.
- Performans bütçelerine uyum (ana akışlarda Lighthouse kontrolü önerilir).
- Yetkilendirme ve oran sınırlama kurallarına uyum.
- Tutarlı hata ve API yanıt şeması.

---
Sorular ve güncellemeler için: `src/design/guide.md` ve bu teknik doküman birlikte sürdürülmelidir.