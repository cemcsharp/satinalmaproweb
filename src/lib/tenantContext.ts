import { NextRequest } from "next/server";
import { getUserWithPermissions } from "@/lib/apiAuth";

export type TenantContext = {
    tenantId: string | null;
    isSuperAdmin: boolean;
    supplierId: string | null;
};

/**
 * Gets tenant context from the current request session.
 */
export async function getTenantContext(req: NextRequest): Promise<TenantContext | null> {
    const user = await getUserWithPermissions(req);
    if (!user) return null;

    return {
        tenantId: user.tenantId,
        isSuperAdmin: user.isSuperAdmin,
        supplierId: user.supplierId
    };
}

/**
 * Helper to build Prisma where clause with tenant isolation.
 * If user is super admin, it returns an empty filter or the provided one.
 * If user is regular tenant user, it merges the tenantId into the filter.
 */
export async function applyTenantFilter(req: NextRequest, where: any = {}): Promise<any> {
    const context = await getTenantContext(req);
    if (!context) return null; // Should probably throw or handle as unauthorized

    if (context.isSuperAdmin) {
        return where;
    }

    return {
        ...where,
        tenantId: context.tenantId
    };
}

/**
 * Ensures that the data being accessed belongs to the user's tenant.
 * Useful for GET /[id] or PATCH /[id] routes.
 */
export async function validateTenantAccess(req: NextRequest, tenantIdInRecord: string | null): Promise<boolean> {
    const context = await getTenantContext(req);
    if (!context) return false;

    if (context.isSuperAdmin) return true;

    return context.tenantId === tenantIdInRecord;
}
