# Kullanıcı İletişim Planı — Rollback (2025-11-06)

## Amaç
Login sisteminin önceki stabil sürüme geri dönüşü hakkında kullanıcıları zamanında, açık ve güven verici biçimde bilgilendirmek.

## Hedef Kitle
- Son kullanıcılar (uygulama kullanıcıları)
- İç paydaşlar (destek, operasyon, BT)

## Mesajlaştırma
- Başlık: "Güncelleme: Giriş Ekranı Eski Sürüme Döndü"
- Özet: Kullanıcı deneyimini sadeleştirmek ve stabiliteyi artırmak amacıyla giriş akışı e‑posta + şifre modeline geri alınmıştır.
- Detaylar:
  - Kullanıcı adı / kullanıcı ID alanları kaldırıldı.
  - Mevcut hesap bilgilerinizle (e‑posta) giriş yapabilirsiniz.
  - Güvenlik ve performans iyileştirmeleri korunmuştur.
- SSS:
  - "Kullanıcı adımla artık giremiyor muyum?" — Evet, e‑posta ile giriş kullanılmaktadır.
  - "Şifremi unuttum, ne yapmalıyım?" — `Şifremi Unuttum` bağlantısını kullanın.
  - "Hata alıyorum, kime yazayım?" — Destek kanalı: support@example.com veya uygulama içi yardım.

## Kanallar ve Zamanlama
- Uygulama içi duyuru bannerı: 1 hafta boyunca.
- E‑posta bilgilendirmesi: Tüm aktif kullanıcılara 1 kez.
- Destek ekibi bilgilendirmesi: Rollback tamamlandıktan hemen sonra.

## Sorumluluklar
- Ürün: Metin ve SSS hazırlığı.
- Destek: Gelen taleplerin yanıtlanması.
- BT/Operasyon: İzleme ve geribildirim.

## İzleme ve Geri Bildirim
- Hata raporları ve başarı oranı: günlük gözlem.
- Login yanıt süreleri ve hata oranları: haftalık rapor.
- Kullanıcı geri bildirimleri: destek sistemi üzerinden toplanır ve haftalık değerlendirilir.

## Kapanış
Rollback tamamlandı ve sistem önceki stabil login akışıyla çalışıyor. İyileştirme önerileri düzenli olarak gözden geçirilecektir.