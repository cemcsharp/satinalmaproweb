# Satın Alma Pro – Tasarım Sistemi ve Bileşen Kılavuzu

Bu kılavuz, tüm sayfa ve modüllerde ortak bir tasarım dili ve bileşen kullanımını standartlaştırır. Amaç: tutarlılık, erişilebilirlik (WCAG), performans ve bakım kolaylığı.

## Tasarım Token’ları (globals.css)
- Arka plan: `var(--background)`
- Metin: `var(--foreground)`
- Kenarlık: `var(--border)` ve tablo kenarlığı: `var(--table-border)`
- Birincil: `var(--primary)` ve `var(--primary-foreground)`
- Vurgu: `var(--accent)` ve `var(--accent-foreground)`
- Form: `--input-bg`, `--input-foreground`, `--input-border`, `--input-hover-bg`, `--input-focus-bg`, `--input-focus-border`
- Semantik: `--success`, `--warning`, `--error`, `--info` ve ilgili `*-foreground`, `*-border`

## Tipografi
- Başlıklar: `h1/h2/h3` base layer’da tanımlıdır.
- Gövde: `var(--font-geist-sans)`; rahat okunur satır yüksekliği.
- Küçük metin: `small { text-muted-foreground }`

## Köşe, Gölge ve Geçiş
- Köşeler: `--radius-sm`, `--radius`, `--radius-lg`
- Gölge: `--shadow`, `--shadow-lg`
- Geçiş: `--transition`, `--transition-fast`

## Focus Ring ve Erişilebilirlik
- `focus-ring` utility: 3px mavi halka (`var(--ring)`)
- Min. kontrast: 4.5:1. Form metinleri: `#111827` üzerinde `#F3F4F6/ #FFFFFF` ≥ 7:1
- Placeholder: `--muted-foreground` (okunabilirlik ≥ 5:1)

## Form Bileşenleri
- Tüm `input/select/textarea`: arka plan `--input-bg`, metin `--input-foreground`, kenarlık `--input-border`
- Hover: `--input-hover-bg`
- Focus: `--input-focus-bg`, kenarlık `--input-focus-border`, `focus-ring`
- Kenarlık sınıfı: `border-[var(--border)]` veya global base kuralları
- Zorunlu alanlar: `required` özniteliği. Hata durumlarında semantic renkler (`error-border`, toast)

## Buton Varyantları
- `primary`: `bg-primary text-primary-foreground`
- `outline`: `bg-transparent border-[var(--border)]`
- `ghost`: arka plan yok, hover ile hafif vurgulu

## Kart ve Bölüm Düzeni
- Kart: `bg-card`, `border-[var(--border)]`, `rounded`, iç boşluk yeterli, gölge opsiyonel
- Bölümler: `PageHeader` + içerik blokları; mobil-öncelikli grid/flex

## Tablo Standartları
- Header: `bg-muted`, metin `foreground`
- Kenarlık: `--table-border`, satır hover: `bg-muted`, zebra opsiyonel (`.table-zebra`)

## Kullanım Örnekleri
- Input: `className="rounded border-[var(--border)] p-2 focus-ring"`
- Select: `className="rounded border-[var(--border)] p-2 focus-ring"`
- Card: `className="rounded border-[var(--border)] bg-card shadow"`

Bu kılavuz, sistem genelinde tutarlı ve erişilebilir arayüzler üretmek için referans alınmalıdır.

---

## Güncel Erişilebilirlik ve Tablo Sıralama Notları

### Tablo Başlık Sıralaması
- Başlık hücresinde `TH` bileşeninin `sortable`, `direction` ve `onSort` props’larını kullanın.
- `direction`: `"ascending" | "descending" | null`. `aria-sort` otomatik ayarlanır.
- Klavye: `Enter`/`Space` ile sıralama tetiklenir.

Örnek:

```tsx
<TH sortable direction={"ascending"} onSort={() => setSortBy("amount")}>Tutar</TH>
```

### Form Hata İletileri
- `Input` ve `Select` bileşenlerinde `error` verildiğinde hata iletisi `role="alert"` ve `aria-live="polite"` ile duyurulur.
- İlgili alan `aria-invalid` ve `aria-describedby` ile işaretlenir.

Örnek:

```tsx
<Input label="Ad" error="Ad zorunlu" />
```

### Modal Odak Yönetimi
- `Modal` bileşeni `role="dialog"` ve `aria-modal="true"` kullanır.
- Açıldığında ilk odaklanabilir öğeye odaklanır, `Escape` tuşu ile kapanır.