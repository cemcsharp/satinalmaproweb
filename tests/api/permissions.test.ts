import { describe, it, expect, vi, beforeEach } from "vitest";
import { userHasPermission, type UserWithPermissions } from "../../src/lib/apiAuth";

describe("Permission Checker", () => {
    it("admin has all permissions", () => {
        const adminUser: UserWithPermissions = {
            id: "admin-1",
            role: "admin",
            permissions: [],
            unitId: null,
            unitLabel: null,
            isAdmin: true,
        };

        expect(userHasPermission(adminUser, "talep:read")).toBe(true);
        expect(userHasPermission(adminUser, "ayarlar:delete")).toBe(true);
        expect(userHasPermission(adminUser, "any:permission")).toBe(true);
    });

    it("regular user only has specific permissions", () => {
        const regularUser: UserWithPermissions = {
            id: "user-1",
            role: "user",
            permissions: ["talep:read", "talep:write"],
            unitId: "unit-1",
            unitLabel: "Test Birimi",
            isAdmin: false,
        };

        expect(userHasPermission(regularUser, "talep:read")).toBe(true);
        expect(userHasPermission(regularUser, "talep:write")).toBe(true);
        expect(userHasPermission(regularUser, "talep:delete")).toBe(false);
        expect(userHasPermission(regularUser, "ayarlar:read")).toBe(false);
    });

    it("manager has intermediate permissions", () => {
        const managerUser: UserWithPermissions = {
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
        };

        expect(userHasPermission(managerUser, "talep:delete")).toBe(true);
        expect(userHasPermission(managerUser, "siparis:write")).toBe(true);
        expect(userHasPermission(managerUser, "ayarlar:write")).toBe(false);
    });
});
