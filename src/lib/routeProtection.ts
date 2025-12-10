/**
 * Client ve edge ortamında ortak kullanılacak koruma kuralı.
 * Bu sayfalar oturum olmadan erişilemez.
 */
export const protectedPrefixes = [
  "/raporlama",
  "/talep",
  "/siparis",
  "/sozlesme",
  "/fatura",
  "/tedarikci",
  "/ayarlar",
  "/profile",
];

export function isProtectedPath(pathname: string): boolean {
  if (pathname === "/" || pathname.startsWith("/login")) return false;
  // Public exceptions
  if (pathname.startsWith("/talep/detay/")) return false;
  if (pathname.startsWith("/siparis/detay/")) return false;
  if (pathname.startsWith("/sozlesme/detay/")) return false;
  return protectedPrefixes.some((p) => pathname.startsWith(p));
}
