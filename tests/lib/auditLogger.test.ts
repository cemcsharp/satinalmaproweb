import { describe, it, expect } from "vitest";
import {
    formatAuditAction,
    formatEntityType,
    computeChanges,
    type AuditAction,
    type AuditEntityType
} from "../../src/lib/auditLogger";

describe("Audit Logger Utilities", () => {
    describe("formatAuditAction", () => {
        it("returns Turkish labels for all actions", () => {
            const actions: AuditAction[] = [
                "CREATE", "UPDATE", "DELETE", "VIEW",
                "LOGIN", "LOGOUT", "APPROVE", "REJECT",
                "EXPORT", "IMPORT"
            ];

            const expectedLabels = [
                "Oluşturma", "Güncelleme", "Silme", "Görüntüleme",
                "Giriş", "Çıkış", "Onaylama", "Reddetme",
                "Dışa Aktarma", "İçe Aktarma"
            ];

            actions.forEach((action, index) => {
                expect(formatAuditAction(action)).toBe(expectedLabels[index]);
            });
        });
    });

    describe("formatEntityType", () => {
        it("returns Turkish labels for all entity types", () => {
            const entityTypes: AuditEntityType[] = [
                "User", "Request", "Order", "Invoice",
                "Contract", "Supplier", "Rfq", "Delivery",
                "Role", "Workflow", "System"
            ];

            const expectedLabels = [
                "Kullanıcı", "Talep", "Sipariş", "Fatura",
                "Sözleşme", "Tedarikçi", "Teklif Talebi", "Teslimat",
                "Rol", "İş Akışı", "Sistem"
            ];

            entityTypes.forEach((entityType, index) => {
                expect(formatEntityType(entityType)).toBe(expectedLabels[index]);
            });
        });
    });

    describe("computeChanges", () => {
        it("returns null when no changes detected", () => {
            const oldData = { name: "Test", value: 100 };
            const newData = { name: "Test", value: 100 };

            expect(computeChanges(oldData, newData)).toBeNull();
        });

        it("detects changed values", () => {
            const oldData = { name: "Old Name", value: 100 };
            const newData = { name: "New Name", value: 100 };

            const result = computeChanges(oldData, newData);

            expect(result).not.toBeNull();
            expect(result?.old.name).toBe("Old Name");
            expect(result?.new.name).toBe("New Name");
            expect(result?.old.value).toBeUndefined(); // unchanged
        });

        it("detects added fields", () => {
            const oldData = { name: "Test" };
            const newData = { name: "Test", description: "New field" };

            const result = computeChanges(oldData, newData);

            expect(result).not.toBeNull();
            expect(result?.old.description).toBeUndefined();
            expect(result?.new.description).toBe("New field");
        });

        it("detects removed fields", () => {
            const oldData = { name: "Test", description: "Old field" };
            const newData = { name: "Test" };

            const result = computeChanges(oldData, newData);

            expect(result).not.toBeNull();
            expect(result?.old.description).toBe("Old field");
            expect(result?.new.description).toBeUndefined();
        });

        it("skips sensitive fields", () => {
            const oldData = {
                name: "Test",
                passwordHash: "old_hash",
                createdAt: new Date("2025-01-01"),
                id: "old-id"
            };
            const newData = {
                name: "Test",
                passwordHash: "new_hash",
                createdAt: new Date("2025-06-01"),
                id: "new-id"
            };

            // Should return null because only sensitive fields changed
            expect(computeChanges(oldData, newData)).toBeNull();
        });
    });
});
