# SatınalmaPRO API Dokümantasyonu

## Genel Bilgi

Bu uygulama, kurumsal satın alma süreçlerini yöneten RESTful bir API sunmaktadır.

**Base URL:** `http://localhost:3000/api`

## Kimlik Doğrulama

Tüm API endpoint'leri (bazı public endpoint'ler hariç) NextAuth.js session-based authentication kullanır.

### Giriş Yapma
```
POST /api/auth/callback/credentials
Content-Type: application/json

{
  "username": "kullanici@email.com",
  "password": "sifre123"
}
```

## API Kategorileri

### 🔐 Auth (Kimlik Doğrulama)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/auth/callback/credentials` | Giriş yap |
| POST | `/auth/signout` | Çıkış yap |
| POST | `/auth/forgot` | Şifre sıfırlama talebi |
| POST | `/auth/reset` | Şifre sıfırla |

### 👤 Users (Kullanıcılar)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/profile` | Mevcut kullanıcı profili |
| PUT | `/profile` | Profil güncelle |
| GET | `/kullanicilar` | Tüm kullanıcıları listele |
| POST | `/kullanicilar` | Yeni kullanıcı oluştur |
| GET | `/kullanicilar/{id}` | Kullanıcı detayı |
| PUT | `/kullanicilar/{id}` | Kullanıcı güncelle |
| DELETE | `/kullanicilar/{id}` | Kullanıcı sil |

### 🎭 Roles (Roller)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/roller` | Tüm rolleri listele |
| POST | `/roller` | Yeni rol oluştur |

### 📋 Requests (Talepler)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/talep` | Tüm talepleri listele |
| POST | `/talep` | Yeni talep oluştur |
| GET | `/talep/{id}` | Talep detayı |
| PUT | `/talep/{id}` | Talep güncelle |
| DELETE | `/talep/{id}` | Talep sil |

### 📦 Orders (Siparişler)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/siparis` | Tüm siparişleri listele |
| POST | `/siparis` | Yeni sipariş oluştur |
| GET | `/siparis/{id}` | Sipariş detayı |
| PUT | `/siparis/{id}` | Sipariş güncelle |
| DELETE | `/siparis/{id}` | Sipariş sil |

### 🚚 Deliveries (Teslimatlar)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/teslimat` | Tüm teslimatları listele |
| GET | `/teslimat/{id}` | Teslimat detayı |
| GET | `/teslimat/public?token=xxx` | Public teslimat formu (tedarikçiler için) |
| POST | `/teslimat/public` | Teslimat bildirimi gönder |

### 🧾 Invoices (Faturalar)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/fatura` | Tüm faturaları listele |
| POST | `/fatura` | Yeni fatura oluştur |
| GET | `/fatura/{id}` | Fatura detayı |
| PUT | `/fatura/{id}` | Fatura güncelle |

### 📄 Contracts (Sözleşmeler)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/sozlesme` | Tüm sözleşmeleri listele |
| POST | `/sozlesme` | Yeni sözleşme oluştur |
| GET | `/sozlesme/{id}` | Sözleşme detayı |
| PUT | `/sozlesme/{id}` | Sözleşme güncelle |

### 🏢 Suppliers (Tedarikçiler)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/tedarikci` | Tüm tedarikçileri listele |
| POST | `/tedarikci` | Yeni tedarikçi oluştur |
| GET | `/tedarikci/{id}` | Tedarikçi detayı |
| PUT | `/tedarikci/{id}` | Tedarikçi güncelle |

### 📊 Reports (Raporlar)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/raporlama/dashboard` | Dashboard istatistikleri |
| GET | `/dashboard/stats` | Detaylı istatistikler |

### ⚙️ Settings (Ayarlar)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/options` | Dropdown seçenekleri |
| GET | `/audit` | Sistem logları |

### 🔔 Notifications (Bildirimler)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/notifications` | Bildirimleri listele |
| POST | `/notifications/{id}/read` | Okundu işaretle |

## Hata Kodları

| Kod | Açıklama |
|-----|----------|
| 200 | Başarılı |
| 201 | Oluşturuldu |
| 400 | Geçersiz istek |
| 401 | Kimlik doğrulama gerekli |
| 403 | Yetki yok |
| 404 | Bulunamadı |
| 500 | Sunucu hatası |

## OpenAPI Specification

Detaylı API spesifikasyonu için: `docs/openapi.json`
