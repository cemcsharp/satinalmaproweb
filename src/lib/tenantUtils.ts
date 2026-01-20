import { Tenant } from "@prisma/client";

/**
 * Checks if a tenant is a buyer organization.
 */
export function isBuyer(tenant: Partial<Tenant> | null | undefined): boolean {
    return !!tenant?.isBuyer;
}

/**
 * Checks if a tenant is a supplier organization.
 */
export function isSupplier(tenant: Partial<Tenant> | null | undefined): boolean {
    return !!tenant?.isSupplier;
}

/**
 * Checks if a tenant is both a buyer and a supplier.
 */
export function isDualRole(tenant: Partial<Tenant> | null | undefined): boolean {
    return !!(tenant?.isBuyer && tenant?.isSupplier);
}

/**
 * Returns a human-readable role description for a tenant.
 */
export function getTenantRoleName(tenant: Partial<Tenant> | null | undefined): string {
    if (isDualRole(tenant)) return "Alıcı & Tedarikçi";
    if (isBuyer(tenant)) return "Alıcı Firma";
    if (isSupplier(tenant)) return "Tedarikçi";
    return "Belirsiz";
}
