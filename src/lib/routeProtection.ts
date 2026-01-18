/**
 * Client ve edge ortamında ortak kullanılacak koruma kuralı.
 * Bu sayfalar oturum olmadan erişilemez.
 */
export const protectedPrefixes = [
  "/dashboard",
  "/raporlama",
  "/talep",
  "/siparis",
  "/sozlesme",
  "/fatura",
  "/tedarikci",
  "/ayarlar",
  "/profile",
  "/admin",
  "/finans",
  "/analitik",
  "/rfq",
  "/teslimat",
  "/urun",
  "/birim",
  "/audit",
  "/api-docs",
];

export function isProtectedPath(pathname: string): boolean {
  // Public paths
  if (pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/portal")) {
    return false;
  }

  // Dashboard is protected
  if (pathname === "/dashboard" || pathname === "/api-docs") {
    return true;
  }

  return protectedPrefixes.some((p) => pathname.startsWith(p));
}
