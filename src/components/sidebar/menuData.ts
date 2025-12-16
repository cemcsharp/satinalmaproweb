/**
 * Sidebar Menu Data
 * 
 * Menu items, categories, colors, and icons for the sidebar navigation.
 */

export type MenuItem = {
    label: string;
    href: string;
    icon: string;
    category: string;
    requiredPermission?: string | string[];
    requiredRole?: string[]; // Sadece bu roller görebilir
    moduleKey?: string; // Modül erişim kontrolü için
};

/**
 * Main menu items for regular users
 */
export const menuItems: MenuItem[] = [
    { label: "Dashboard", href: "/", icon: "home", category: "Ana" },
    { label: "Talep Oluştur", href: "/talep/olustur", icon: "file-plus", category: "Talep", requiredPermission: "talep:create", moduleKey: "talep" },
    { label: "Talep Listesi", href: "/talep/liste", icon: "file-text", category: "Talep", requiredPermission: "talep:read", moduleKey: "talep" },

    // Teklif (RFQ) - Talep'ten sonra, Sipariş'ten önce
    { label: "Teklif Listesi", href: "/rfq/liste", icon: "inbox", category: "Teklif", moduleKey: "rfq" },
    { label: "Yeni RFQ", href: "/rfq/olustur", icon: "file-plus", category: "Teklif", requiredRole: ["admin", "satinalma_muduru"], moduleKey: "rfq" },

    { label: "Sipariş Oluştur", href: "/siparis/olustur", icon: "cart", category: "Sipariş", requiredPermission: "siparis:create", moduleKey: "siparis" },
    { label: "Sipariş Listesi", href: "/siparis/liste", icon: "package", category: "Sipariş", requiredPermission: "siparis:read", moduleKey: "siparis" },

    // Teslimat
    { label: "Bekleyen Teslimatlar", href: "/teslimat/bekleyen", icon: "truck", category: "Teslimat", requiredPermission: "teslimat:read", moduleKey: "teslimat" },
    { label: "Onay Bekleyenler", href: "/teslimat/onay", icon: "clipboard-check", category: "Teslimat", requiredPermission: "teslimat:read", moduleKey: "teslimat" },
    { label: "Teslimat Geçmişi", href: "/teslimat/gecmis", icon: "history", category: "Teslimat", requiredPermission: "teslimat:read", moduleKey: "teslimat" },

    { label: "Sözleşme Oluştur", href: "/sozlesme/olustur", icon: "document", category: "Sözleşme", requiredPermission: "sozlesme:create", moduleKey: "sozlesme" },
    { label: "Sözleşme Listesi", href: "/sozlesme/liste", icon: "clipboard", category: "Sözleşme", requiredPermission: "sozlesme:read", moduleKey: "sozlesme" },
    { label: "Fatura Oluştur", href: "/fatura/olustur", icon: "receipt", category: "Fatura", requiredPermission: "fatura:create", moduleKey: "fatura" },
    { label: "Fatura Listesi", href: "/fatura/liste", icon: "document", category: "Fatura", requiredPermission: "fatura:read", moduleKey: "fatura" },
    { label: "Tedarikçi Oluştur", href: "/tedarikci/olustur", icon: "user-plus", category: "Tedarikçi", requiredPermission: "tedarikci:create", moduleKey: "tedarikci" },
    { label: "Tedarikçi Listesi", href: "/tedarikci/liste", icon: "users", category: "Tedarikçi", requiredPermission: "tedarikci:read", moduleKey: "tedarikci" },
    { label: "Sektörler / Kategoriler", href: "/tedarikci/kategoriler", icon: "folder", category: "Tedarikçi", requiredPermission: "tedarikci:read", moduleKey: "tedarikci" },
    { label: "Tedarikçi Değerlendirme", href: "/tedarikci/degerlendirme", icon: "star", category: "Tedarikçi", requiredPermission: "evaluation:submit", moduleKey: "tedarikci" },
    { label: "Değerlendirmeler", href: "/tedarikci/degerlendirmeler", icon: "bar-chart", category: "Tedarikçi", requiredPermission: "tedarikci:read", moduleKey: "tedarikci" },
    { label: "Raporlar", href: "/raporlama/raporlar", icon: "clipboard", category: "Raporlama", requiredPermission: "rapor:read", moduleKey: "raporlama" },
    { label: "Dashboard", href: "/raporlama/dashboard", icon: "pie-chart", category: "Raporlama", requiredPermission: "rapor:read", moduleKey: "raporlama" },

    // Ürün Katalog Modülü (Ayrı kategori)
    { label: "Ürün Listesi", href: "/urun/liste", icon: "package", category: "Ürün", moduleKey: "urun" },
    { label: "Ürün Ekle", href: "/urun/olustur", icon: "plus-circle", category: "Ürün", requiredRole: ["admin", "satinalma_muduru"], moduleKey: "urun" },
    { label: "Kategoriler", href: "/urun/kategoriler", icon: "folder", category: "Ürün", requiredRole: ["admin", "satinalma_muduru"], moduleKey: "urun" },

    // Ayarlar - Sadece admin erişebilir
    { label: "Ayarlar", href: "/ayarlar", icon: "settings", category: "Ayarlar", requiredRole: ["admin"] },
];

/**
 * Restricted menu for birim_evaluator role
 */
export const evaluatorMenuItems: MenuItem[] = [
    { label: "Dashboard", href: "/", icon: "home", category: "Ana" },
    { label: "Değerlendirmelerim", href: "/birim/degerlendirmeler", icon: "star", category: "Değerlendirme" },
    { label: "Değerlendirme Yap", href: "/tedarikci/degerlendirme", icon: "check-square", category: "Değerlendirme" },
];

/**
 * Category order for navigation
 */
export const categories = ["Ana", "Talep", "Teklif", "Sipariş", "Teslimat", "Sözleşme", "Fatura", "Tedarikçi", "Ürün", "Raporlama", "Ayarlar"];
export const evaluatorCategories = ["Ana", "Değerlendirme"];

/**
 * Category gradient colors
 */
export const categoryColors: Record<string, string> = {
    "Ana": "from-blue-500 to-indigo-500",
    "Talep": "from-emerald-500 to-teal-500",
    "Sipariş": "from-orange-500 to-amber-500",
    "Teslimat": "from-blue-600 to-cyan-600",
    "Teklif": "from-violet-500 to-purple-600",
    "Sözleşme": "from-purple-500 to-violet-500",
    "Fatura": "from-rose-500 to-pink-500",
    "Tedarikçi": "from-lime-500 to-green-500",
    "Ürün": "from-amber-500 to-yellow-500",
    "Raporlama": "from-fuchsia-500 to-purple-500",
    "Ayarlar": "from-slate-500 to-gray-500",
    "Değerlendirme": "from-emerald-500 to-green-500",
};

/**
 * Category icons
 */
export const categoryIcons: Record<string, string> = {
    "Ana": "home",
    "Talep": "file-plus",
    "Sipariş": "cart",
    "Teslimat": "truck",
    "Teklif": "inbox",
    "Sözleşme": "document",
    "Fatura": "receipt",
    "Tedarikçi": "users",
    "Raporlama": "bar-chart",
    "Ayarlar": "settings",
    "Değerlendirme": "star",
    "Ürün": "package",
};
