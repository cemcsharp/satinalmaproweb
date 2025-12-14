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
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) return false;
  // Dashboard is also protected now (handled by page.tsx but good to enforce here too)
  if (pathname === "/") return true;

  return protectedPrefixes.some((p) => pathname.startsWith(p));
}
