/**
 * Sidebar Menu Data - Professional v2.0
 * 
 * Includes RBAC v2.0 roles and strategic categorization.
 */

export type MenuItem = {
    label: string;
    href: string;
    icon: string;
    category: string;
    requiredPermission?: string | string[];
    requiredRole?: string[];
    moduleKey?: string;
};

/**
 * Main menu items for regular users & professional roles
 */
export const menuItems: MenuItem[] = [
    { label: "Control Tower", href: "/dashboard", icon: "home", category: "Genel" },
    { label: "Organizasyon", href: "/organization/settings", icon: "settings", category: "Genel", requiredRole: ["buyer_admin", "supplier_admin", "admin"] },


    // OPERASYONEL (Satınalma Döngüsü)
    { label: "Yeni Talep", href: "/talep/olustur", icon: "file-plus", category: "Operasyon", requiredPermission: "request:create" },
    { label: "Talep Havuzu", href: "/talep/liste", icon: "file-text", category: "Operasyon", requiredPermission: "request:view" },
    { label: "Teklifler (RFQ)", href: "/rfq/liste", icon: "inbox", category: "Operasyon", requiredPermission: "rfq:read" },
    { label: "Siparişler", href: "/siparis/liste", icon: "package", category: "Operasyon", requiredPermission: "order:read" },
    { label: "Teslimatlar", href: "/teslimat/bekleyen", icon: "truck", category: "Operasyon", requiredPermission: "delivery:read" },

    // FİNANSAL (Kontrol ve Uyum)
    { label: "Bütçe Konsolu", href: "/finans/butce", icon: "bar-chart", category: "Finans", requiredPermission: "budget:view" },
    { label: "Faturalar", href: "/fatura/liste", icon: "receipt", category: "Finans", requiredPermission: "invoice:read" },
    { label: "Sözleşmeler", href: "/finans/sozlesmeler", icon: "clipboard", category: "Finans", requiredPermission: "sozlesme:read" },

    // STRATEJİK (Tedarikçi ve Katalog)
    { label: "Tedarikçi Havuzu", href: "/tedarikci/liste", icon: "users", category: "Stratejik", requiredPermission: "tedarikci:read" },
    { label: "Onay Bekleyenler", href: "/tedarikci/onay-bekleyenler", icon: "clipboard-check", category: "Stratejik", requiredPermission: "supplier:verify" },
    { label: "Katalog (UNSPSC)", href: "/urun/kategoriler", icon: "folder", category: "Stratejik", requiredPermission: "category:manage" },
    { label: "Ürünler", href: "/urun/liste", icon: "package", category: "Stratejik", requiredPermission: "urun:read" },

    // ANALİTİK (Raporlama)
    { label: "Analiz Dashboard", href: "/analitik", icon: "pie-chart", category: "Analitik", requiredPermission: "report:view" },
    { label: "Tüm Raporlar", href: "/raporlama/raporlar", icon: "clipboard", category: "Analitik", requiredPermission: "report:view" },

    // SİSTEM (Yönetim)
    { label: "Departmanlar", href: "/admin/departmanlar", icon: "users", category: "Sistem", requiredRole: ["admin"] },
    { label: "Kullanıcılar", href: "/admin/kullanicilar", icon: "user-plus", category: "Sistem", requiredRole: ["admin"] },
    { label: "Rol & Yetki", href: "/admin/roller", icon: "shield", category: "Sistem", requiredRole: ["admin"] },
    { label: "Genel Ayarlar", href: "/admin/genel", icon: "settings", category: "Sistem", requiredRole: ["admin"] },

    // AYARLAR ALT MENÜSÜ
    { label: "Listeler", href: "/ayarlar/listeler", icon: "list", category: "Sistem", requiredRole: ["admin"] },
    { label: "Teslimat Adresleri", href: "/ayarlar/adresler", icon: "map-pin", category: "Sistem", requiredRole: ["admin"] },
    { label: "Değerlendirme Kriterleri", href: "/ayarlar/degerlendirme", icon: "star", category: "Sistem", requiredRole: ["admin"] },
    { label: "E-posta Ayarları", href: "/ayarlar/e-posta", icon: "mail", category: "Sistem", requiredRole: ["admin"] },
];

export const evaluatorMenuItems: MenuItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: "home", category: "Genel" },
    { label: "Değerlendirmelerim", href: "/birim/degerlendirmeler", icon: "star", category: "Değerlendirme" },
];

/**
 * Category order for navigation
 */
export const categories = ["Genel", "Operasyon", "Finans", "Stratejik", "Analitik", "Sistem", "Değerlendirme"];

/**
 * Category gradient colors - Ocean Blue Corporate Theme
 * All categories use consistent blue tones for brand unity
 */
export const categoryColors: Record<string, string> = {
    "Genel": "from-slate-600 to-slate-700",
    "Operasyon": "from-sky-600 to-blue-700",
    "Finans": "from-sky-700 to-blue-800",
    "Stratejik": "from-blue-600 to-indigo-700",
    "Analitik": "from-indigo-600 to-blue-700",
    "Sistem": "from-slate-700 to-slate-800",
    "Değerlendirme": "from-sky-600 to-blue-700",
};

/**
 * Category icons
 */
export const categoryIcons: Record<string, string> = {
    "Genel": "home",
    "Operasyon": "cart",
    "Finans": "receipt",
    "Stratejik": "users",
    "Analitik": "bar-chart",
    "Sistem": "settings",
};
