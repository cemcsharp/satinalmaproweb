import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../../src/app/api/search/route";
import { prisma } from "../../src/lib/db";
import { getUserWithPermissions } from "../../src/lib/apiAuth";
import { NextRequest } from "next/server";
import { createMockUser, createMockRequest, createMockOrder } from "../helpers/mockHelpers";

// Mock the dependencies
vi.mock("../../src/lib/db", () => ({
    prisma: {
        request: { findMany: vi.fn() },
        order: { findMany: vi.fn() },
        contract: { findMany: vi.fn() },
        invoice: { findMany: vi.fn() },
        supplier: { findMany: vi.fn() },
    },
}));

vi.mock("../../src/lib/apiAuth", () => ({
    getUserWithPermissions: vi.fn(),
}));

describe("Search API", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createReq = (query: string = "") => {
        return new NextRequest(`http://localhost/api/search?q=${query}`);
    };

    it("returns empty results for empty query", async () => {
        const req = createReq("");
        const res = await GET(req);
        const data = await res.json();

        expect(data.results).toEqual([]);
        expect(data.count).toBe(0);
    });

    it("returns empty results for short query", async () => {
        const req = createReq("a");
        const res = await GET(req);
        const data = await res.json();

        expect(data.results).toEqual([]);
        expect(data.count).toBe(0);
    });

    it("performs search across all authorized modules", async () => {
        // Mock user with all permissions
        (getUserWithPermissions as any).mockResolvedValue(createMockUser({
            permissions: ["talep:read", "siparis:read", "sozlesme:read", "fatura:read", "tedarikci:read"]
        }));

        // Mock Prisma responses
        (prisma.request.findMany as any).mockResolvedValue([
            createMockRequest({ id: "req-1", barcode: "TLP-001", subject: "Test Subject", createdAt: new Date() })
        ]);
        (prisma.order.findMany as any).mockResolvedValue([
            createMockOrder({ id: "ord-1", barcode: "SIP-001", createdAt: new Date() })
        ]);
        (prisma.contract.findMany as any).mockResolvedValue([]);
        (prisma.invoice.findMany as any).mockResolvedValue([]);
        (prisma.supplier.findMany as any).mockResolvedValue([]);

        const req = createReq("test");
        const res = await GET(req);
        const data = await res.json();

        expect(data.results.length).toBeGreaterThan(0);
        expect(data.modules.talep).toBe(1);
        expect(data.modules.siparis).toBe(1);

        // Verify prisma calls
        expect(prisma.request.findMany).toHaveBeenCalled();
        expect(prisma.order.findMany).toHaveBeenCalled();
    });

    it("filters results based on user permissions", async () => {
        // User only has permission for 'talep'
        (getUserWithPermissions as any).mockResolvedValue(createMockUser({
            permissions: ["talep:read"]
        }));

        // Even if prisma would return orders, they should not be queried
        (prisma.request.findMany as any).mockResolvedValue([createMockRequest()]);

        const req = createReq("test");
        await GET(req);

        // Requests should be queried
        expect(prisma.request.findMany).toHaveBeenCalled();
        // Orders should NOT be queried
        expect(prisma.order.findMany).not.toHaveBeenCalled();
    });

    it("handles module filtering", async () => {
        (getUserWithPermissions as any).mockResolvedValue(createMockUser({
            permissions: ["talep:read", "siparis:read"]
        }));

        const req = new NextRequest("http://localhost/api/search?q=test&module=talep");
        await GET(req);

        // Only requests should be queried
        expect(prisma.request.findMany).toHaveBeenCalled();
        expect(prisma.order.findMany).not.toHaveBeenCalled();
    });

    it("handles errors gracefully", async () => {
        (getUserWithPermissions as any).mockResolvedValue(createMockUser({
            permissions: ["talep:read"]
        }));
        (prisma.request.findMany as any).mockRejectedValue(new Error("DB Error"));

        const req = createReq("test");
        const res = await GET(req);
        const data = await res.json();

        expect(res.status).toBe(500);
        expect(data.error).toBe("Arama sırasında bir hata oluştu");
    });
});
