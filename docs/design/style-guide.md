# Tasarım Sistemi Stil Kılavuzu

## Renk Paleti
- Primary: `#7C3AED` (dark: `#2563EB`)
- Secondary (Accent): `#06B6D4`
- Background: `var(--background)`
- Foreground: `var(--foreground)`
- Muted: `var(--muted)` / `var(--muted-foreground)`
- Success: `#10B981`
- Warning: `#F59E0B`
- Error: `#EF4444`
- Info: `#38BDF8`

## Tipografi
- Font ailesi: `Geist Sans`, `Geist Mono`
- Başlıklar: `h1`, `h2`, `h3` ölçekli ve `font-semibold`
- Paragraf: `leading-relaxed`
- Küçük metin: `text-xs`, `text-muted-foreground`

## Butonlar
- Varyantlar: `primary`, `outline`, `ghost`
- Boyutlar: `sm`, `md`, `lg`
- Erişilebilirlik: `focus-visible` ring, `aria-busy` ve `aria-disabled`

## Form Kontrolleri
- `input`, `select`, `textarea` arka plan ve kenarlıklar tasarım değişkenleri ile yönetilir
- Odak durumunda `box-shadow: 0 0 0 3px var(--ring)`

## Boşluklar
- Container padding: `px-4` (md: `px-6`)
- Grid boşlukları: `gap-4` → `gap-6`
- Bileşen iç boşlukları: `px-3 py-2` → `px-4 py-2.5`

## Ortak Layout
- Header: gradient from `--primary` to `--accent`
- Footer: `bg-[var(--sidebar-bg)]`
- Navigasyon: `Sidebar` komponenti; mobilde drawer davranışı
- İçerik alanı: `container` + `py-4 md:py-6`

## Responsive Kurallar
- `container` genişlikleri: 320, 768, 1024, 1200
- `content-grid` kolonlar: 1 → 2 → 3
- Dokunmatik cihazlar için minimum tuş boyutu: `48px`

## Tasarım Token’ları
- Renk ve tipografi değişkenleri `src/app/globals.css` içinde tanımlıdır
- Tailwind v4 `@theme inline` ile token eşlemeleri kullanılır

## Bileşen Kütüphanesi
- Konum: `src/components/ui`
- Bileşenler: `Button`, `Input`, `Select`, `Modal`, `Toast`, `Table`, `Card`, `Badge`, `Alert`, `Skeleton`, `PageHeader`
- Varyasyonlar ve durumlar: `variant`, `size`, `loading`, `disabled`

## Tutarlılık
- Tüm ekranlar `Shell` layout’u ile header/footer ve container yapısını kullanır
- Renkler ve boşluklar yalnızca token’lar üzerinden tanımlanır

## Test ve İnceleme
- UI testleri: `tests/ui` altında bileşen varyantları ve erişilebilirlik öznitelikleri doğrulanır
- Design review: yeni ekranlar PR açılmadan önce kılavuz referansıyla kontrol edilir