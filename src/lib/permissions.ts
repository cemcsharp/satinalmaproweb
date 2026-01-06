/**
 * İzin Tanımları
 * Uygulama genelinde kullanılan tüm izinler
 */

// İzin kategorileri ve tanımları
export const PERMISSION_CATEGORIES = {
    talep: {
        label: "Talep",
        permissions: [
            { key: "talep:read", label: "Görüntüleme" },
            { key: "talep:create", label: "Oluşturma" },
            { key: "talep:edit", label: "Düzenleme" },
            { key: "talep:delete", label: "Silme" },
        ],
    },
    siparis: {
        label: "Sipariş",
        permissions: [
            { key: "siparis:read", label: "Görüntüleme" },
            { key: "siparis:create", label: "Oluşturma" },
            { key: "siparis:edit", label: "Düzenleme" },
            { key: "siparis:delete", label: "Silme" },
        ],
    },
    rfq: {
        label: "RFQ/Teklif",
        permissions: [
            { key: "rfq:read", label: "Görüntüleme" },
            { key: "rfq:create", label: "Oluşturma" },
            { key: "rfq:edit", label: "Düzenleme" },
            { key: "rfq:delete", label: "Silme" },
            { key: "offer:submit", label: "Teklif Verme" },
            { key: "portal:access", label: "Portal Erişimi" },
        ],
    },
    teslimat: {
        label: "Teslimat",
        permissions: [
            { key: "teslimat:read", label: "Görüntüleme" },
            { key: "teslimat:create", label: "Oluşturma" },
            { key: "teslimat:edit", label: "Düzenleme" },
            { key: "teslimat:delete", label: "Silme" },
        ],
    },
    fatura: {
        label: "Fatura",
        permissions: [
            { key: "fatura:read", label: "Görüntüleme" },
            { key: "fatura:create", label: "Oluşturma" },
            { key: "fatura:edit", label: "Düzenleme" },
            { key: "fatura:delete", label: "Silme" },
        ],
    },
    sozlesme: {
        label: "Sözleşme",
        permissions: [
            { key: "sozlesme:read", label: "Görüntüleme" },
            { key: "sozlesme:create", label: "Oluşturma" },
            { key: "sozlesme:edit", label: "Düzenleme" },
            { key: "sozlesme:delete", label: "Silme" },
        ],
    },
    tedarikci: {
        label: "Tedarikçi",
        permissions: [
            { key: "tedarikci:read", label: "Görüntüleme" },
            { key: "tedarikci:create", label: "Oluşturma" },
            { key: "tedarikci:edit", label: "Düzenleme" },
            { key: "tedarikci:delete", label: "Silme" },
            { key: "evaluation:submit", label: "Değerlendirme Yapma" },
        ],
    },
    urun: {
        label: "Ürün",
        permissions: [
            { key: "urun:read", label: "Görüntüleme" },
            { key: "urun:create", label: "Oluşturma" },
            { key: "urun:edit", label: "Düzenleme" },
            { key: "urun:delete", label: "Silme" },
        ],
    },
    rapor: {
        label: "Raporlama",
        permissions: [
            { key: "rapor:read", label: "Görüntüleme" },
        ],
    },
    ayarlar: {
        label: "Ayarlar",
        permissions: [
            { key: "ayarlar:read", label: "Görüntüleme" },
            { key: "ayarlar:edit", label: "Düzenleme" },
            { key: "user:manage", label: "Kullanıcı Yönetimi" },
            { key: "role:manage", label: "Rol Yönetimi" },
        ],
    },
} as const;

// Tüm izinlerin düz listesi
export const ALL_PERMISSIONS = Object.values(PERMISSION_CATEGORIES).flatMap(
    (cat) => cat.permissions.map((p) => p.key)
);

// İzin tipi
export type Permission = typeof ALL_PERMISSIONS[number];

/**
 * Kullanıcının belirtilen izne sahip olup olmadığını kontrol eder
 * Admin rolü her zaman tüm izinlere sahiptir
 */
export function hasPermission(
    userPermissions: string[] | null | undefined,
    requiredPermission: string | string[],
    userRole?: string
): boolean {
    // Admin bypass - admin her şeyi yapabilir
    if (userRole === "admin") return true;

    // Permission yok ise erişim yok
    if (!userPermissions || userPermissions.length === 0) {
        return false;
    }

    // Array ise herhangi birini içeriyorsa yeterli (OR logic)
    if (Array.isArray(requiredPermission)) {
        return requiredPermission.some(p => userPermissions.includes(p));
    }

    // Single permission check
    return userPermissions.includes(requiredPermission);
}

/**
 * Kullanıcının tüm belirtilen izinlere sahip olup olmadığını kontrol eder
 */
export function hasAllPermissions(
    userPermissions: string[] | null | undefined,
    requiredPermissions: string[],
    userRole?: string
): boolean {
    // Admin bypass
    if (userRole === "admin") return true;

    // Permission yok ise erişim yok
    if (!userPermissions || userPermissions.length === 0) {
        return false;
    }

    // Tüm izinlere sahip olmalı (AND logic)
    return requiredPermissions.every(p => userPermissions.includes(p));
}

/**
 * İzin key'inden kategorisini ve label'ını döndürür
 */
export function getPermissionInfo(permissionKey: string): { category: string; label: string } | null {
    for (const [catKey, cat] of Object.entries(PERMISSION_CATEGORIES)) {
        const perm = cat.permissions.find((p) => p.key === permissionKey);
        if (perm) {
            return { category: cat.label, label: perm.label };
        }
    }
    return null;
}

