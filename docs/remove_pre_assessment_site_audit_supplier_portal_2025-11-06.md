# Kaldırma İşlemi: Ön Değerlendirme, Sahada Denetim ve Tedarikçi Portalı (2025-11-06)

Bu doküman, tedarikçi değerlendirme sürecindeki aşağıdaki modüllerin sistemden tamamen kaldırılmasını kapsamaktadır:

- Ön değerlendirme
- Sahada denetim
- Tedarikçi portalı

## Yapılan Değişiklikler

- UI menü ve sayfalar kaldırıldı:
  - `src/components/Sidebar.tsx`: İlgili menü öğeleri kaldırıldı.
  - `src/app/tedarikci/on-degerlendirme/page.tsx`: Silindi.
  - `src/app/tedarikci/denetim/page.tsx`: Silindi.
  - `src/app/tedarikci/portal/page.tsx` ve `src/app/tedarikci/portal/[id]/page.tsx`: Silindi.
- API uçları kaldırıldı:
  - `src/app/api/tedarikci/on-degerlendirme/route.ts`: Silindi.
  - `src/app/api/tedarikci/denetim/route.ts`: Silindi.
  - `src/app/api/raporlama/iso9001/route.ts`: Silindi (ilgili raporlama UI’ı da temizlendi).
- Log dosyaları temizlendi:
  - `logs/iso9001/pre_assessment.jsonl` ve `logs/iso9001/site_audit.jsonl` (varsa silindi).
- Raporlama sayfası güncellendi:
  - `src/app/raporlama/tedarikci-raporlari/page.tsx` içinden Ön Değerlendirme ve Sahada Denetim özet kartları kaldırıldı.

## Veritabanı

- Prisma şemasında bu modüllere özgü bir tablo/ilişki bulunmadığı doğrulanmıştır. Dolayısıyla DB tarafında silinmesi gereken özel tablolar yoktur.
- Diğer tedarikçi değerlendirme, CAPA ve performans ölçümü modelleri korunmuştur.

## Yetkilendirme

- Kaldırılan sayfalara ait route’lar artık mevcut olmadığından ek bir yetki güncellemesi gerekmemektedir.
- Mevcut rol/yetki yapısı korunmuştur.

## Test ve Doğrulama

- Sidebar menüsü üzerinde ilgili öğelerin görünmediği doğrulandı.
- `/raporlama/tedarikci-raporlari` sayfası çalışır durumda ve otomatik tedarikçi değerlendirme özeti (dönem filtresi ile) beklenen şekilde çalışıyor.
- Kaldırılan API’lara istek atılamıyor; 404 beklenen davranıştır.

## Kullanıcı Bilgilendirmesi (Öneri)

- Kısa duyuru: “Ön değerlendirme, sahada denetim ve tedarikçi portalı modülleri sistemden kaldırılmıştır. Raporlama ve tedarikçi değerlendirme fonksiyonları kullanılmaya devam edecektir.”
- SSS/yardım: Değişikliklerin etkisi ve alternatif akışlar (ör. değerlendirme sürecinin kalan adımları) açıklanmalıdır.

## İzleyen İşler

- Gerekirse arşiv amaçlı eski logların yedeklemesi (silinen dosyalar haricinde),
- Raporlama modülünde yeni KPI’lar/özetler eklemek,
- CAPA süreçleriyle entegrasyon fırsatlarını değerlendirmek.