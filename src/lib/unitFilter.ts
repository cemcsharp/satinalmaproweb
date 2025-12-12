import { prisma } from "@/lib/db";

/**
 * Birim Bazlı Erişim Kontrolü Utility
 * 
 * Kullanıcıların sadece kendi birimlerine ait verileri görmesini sağlar.
 */

type UserInfo = {
    id: string;
    unitId?: string | null;
    roleKey?: string;
    isAdmin?: boolean;
};

/**
 * Admin rollerinin listesi - bu roller tüm verileri görebilir
 */
const ADMIN_ROLES = ["admin", "super_admin", "system"];

/**
 * Kullanıcının admin olup olmadığını kontrol eder
 */
export function isUserAdmin(user: UserInfo): boolean {
    if (user.isAdmin) return true;
    if (user.roleKey && ADMIN_ROLES.includes(user.roleKey)) return true;
    return false;
}

/**
 * Kullanıcının profil bilgilerini çeker (birim dahil)
 */
export async function getUserWithUnit(userId: string): Promise<UserInfo | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                unitId: true,
                roleRef: {
                    select: {
                        key: true,
                    },
                },
            },
        });

        if (!user) return null;

        return {
            id: user.id,
            unitId: user.unitId,
            roleKey: user.roleRef?.key,
            isAdmin: user.roleRef?.key ? ADMIN_ROLES.includes(user.roleRef.key) : false,
        };
    } catch {
        return null;
    }
}

/**
 * Birim filtresi oluşturur - Prisma where clause için
 * 
 * @param user - Kullanıcı bilgisi
 * @param unitFieldName - Filtrelenecek alanın adı (default: "unitId")
 * @returns Prisma where clause veya undefined (admin ise filtre uygulanmaz)
 * 
 * Kullanım:
 * ```ts
 * const filter = getUnitFilter(user, "ownerUnitId");
 * const data = await prisma.request.findMany({
 *   where: {
 *     ...filter,
 *     // diğer filtreler
 *   }
 * });
 * ```
 */
export function getUnitFilter(
    user: UserInfo,
    unitFieldName: string = "unitId"
): Record<string, string> | undefined {
    // Admin tüm verileri görebilir
    if (isUserAdmin(user)) {
        return undefined;
    }

    // Kullanıcının birimi yoksa hiçbir veri göremez
    if (!user.unitId) {
        return { [unitFieldName]: "___NO_ACCESS___" }; // Hiçbir şeyle eşleşmeyecek
    }

    // Kullanıcının birimine göre filtrele
    return { [unitFieldName]: user.unitId };
}

/**
 * Kullanıcının belirli bir birime erişimi olup olmadığını kontrol eder
 */
export function canAccessUnit(user: UserInfo, targetUnitId: string | null | undefined): boolean {
    // Admin her birime erişebilir
    if (isUserAdmin(user)) return true;

    // Hedef birim yoksa erişim yok
    if (!targetUnitId) return false;

    // Kullanıcının birimi yoksa erişim yok
    if (!user.unitId) return false;

    // Aynı birim ise erişim var
    return user.unitId === targetUnitId;
}

/**
 * Request için birim filtresi (ownerUnitId veya requesterUnitId)
 */
export function getRequestUnitFilter(user: UserInfo) {
    if (isUserAdmin(user)) return {};

    if (!user.unitId) {
        return { ownerUnitId: "___NO_ACCESS___" };
    }

    return {
        OR: [
            { ownerUnitId: user.unitId },
            { requesterUnitId: user.unitId },
        ],
    };
}

/**
 * Sipariş için birim filtresi
 */
export function getOrderUnitFilter(user: UserInfo) {
    return getUnitFilter(user, "unitId");
}

/**
 * Fatura için birim filtresi (sipariş üzerinden)
 */
export function getInvoiceUnitFilter(user: UserInfo) {
    if (isUserAdmin(user)) return {};

    if (!user.unitId) {
        return { order: { unitId: "___NO_ACCESS___" } };
    }

    return {
        order: {
            unitId: user.unitId,
        },
    };
}

/**
 * Sözleşme için birim filtresi
 */
export function getContractUnitFilter(user: UserInfo) {
    return getUnitFilter(user, "unitId");
}

/**
 * Tedarikçi değerlendirmesi için birim filtresi
 */
export function getEvaluationUnitFilter(user: UserInfo) {
    return getUnitFilter(user, "evaluatorUnitId");
}

/**
 * Yeni kayıt oluştururken birim ID'sini otomatik ekler
 */
export function getUnitIdForCreate(user: UserInfo): string | undefined {
    return user.unitId || undefined;
}
