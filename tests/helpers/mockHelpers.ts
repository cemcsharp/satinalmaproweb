/**
 * Test Helper Utilities
 * 
 * Common utilities for creating mock data in tests.
 */

import { type UserWithPermissions } from "@/lib/apiAuth";

/**
 * Create a mock user with specified permissions
 */
export function createMockUser(overrides: Partial<UserWithPermissions> = {}): UserWithPermissions {
    return {
        id: "test-user-1",
        role: "user",
        permissions: [],
        unitId: null,
        unitLabel: null,
        isAdmin: false,
        ...overrides,
    };
}

/**
 * Create a mock admin user
 */
export function createMockAdmin(): UserWithPermissions {
    return createMockUser({
        id: "admin-1",
        role: "admin",
        permissions: [],
        isAdmin: true,
    });
}

/**
 * Create a mock manager user
 */
export function createMockManager(): UserWithPermissions {
    return createMockUser({
        id: "manager-1",
        role: "manager",
        permissions: [
            "talep:read", "talep:write", "talep:delete",
            "siparis:read", "siparis:write",
            "teslimat:read", "teslimat:write",
        ],
        unitId: "unit-1",
        unitLabel: "Test Birimi",
        isAdmin: false,
    });
}

/**
 * Create a mock purchasing user
 */
export function createMockPurchasingUser(): UserWithPermissions {
    return createMockUser({
        id: "purchasing-1",
        role: "satinalma",
        permissions: [
            "talep:read", "talep:write", "talep:approve",
            "siparis:read", "siparis:write", "siparis:create",
            "rfq:read", "rfq:write", "rfq:create",
            "tedarikci:read", "tedarikci:write",
        ],
        unitId: "satinalma-unit",
        unitLabel: "Satınalma Birimi",
        isAdmin: false,
    });
}

/**
 * Create mock request data
 */
export function createMockRequest(overrides: Record<string, any> = {}) {
    return {
        id: "request-1",
        barcode: "TLP-2026-0001",
        subject: "Test Talebi",
        budget: 10000,
        statusId: "status-1",
        unitId: "unit-1",
        currencyId: "currency-1",
        relatedPersonId: "person-1",
        ownerUserId: "owner-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}

/**
 * Create mock order data
 */
export function createMockOrder(overrides: Record<string, any> = {}) {
    return {
        id: "order-1",
        barcode: "SIP-2026-0001",
        total: 15000,
        supplierId: "supplier-1",
        companyId: "company-1",
        statusId: "status-1",
        requestId: "request-1",
        responsibleId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}

/**
 * Create mock supplier data
 */
export function createMockSupplier(overrides: Record<string, any> = {}) {
    return {
        id: "supplier-1",
        name: "Test Tedarikçi A.Ş.",
        taxId: "1234567890",
        email: "info@test-supplier.com",
        phone: "+90 212 555 1234",
        address: "Test Mahallesi, Test Caddesi No:1",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}

/**
 * Create mock invoice data
 */
export function createMockInvoice(overrides: Record<string, any> = {}) {
    return {
        id: "invoice-1",
        number: "FAT-2026-0001",
        orderNo: "SIP-2026-0001",
        amount: 15000,
        status: "Beklemede",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        bank: "Test Bank",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}
