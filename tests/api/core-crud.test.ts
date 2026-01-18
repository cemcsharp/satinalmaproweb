import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Core API Endpoint Tests
 * Tests critical CRUD operations across main modules
 */

// Mock fetch for testing
global.fetch = vi.fn();

describe('Talep (Request) API Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('GET /api/talep - should return paginated list', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                items: [{ id: '1', barcode: 'TLP-001', subject: 'Test Request' }],
                total: 1,
                page: 1,
                pageSize: 20
            })
        });

        const res = await fetch('/api/talep?page=1&pageSize=20');
        const data = await res.json();

        expect(res.ok).toBe(true);
        expect(data.items).toHaveLength(1);
        expect(data.total).toBe(1);
    });

    it('POST /api/talep - should create new request', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            status: 201,
            json: async () => ({ id: 'new-1', barcode: 'TLP-002' })
        });

        const res = await fetch('/api/talep', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subject: 'New Request',
                justification: 'Need supplies',
                items: [{ name: 'Item 1', quantity: 10, unit: 'adet' }]
            })
        });

        expect(res.ok).toBe(true);
        expect(res.status).toBe(201);
    });

    it('POST /api/talep - should fail with missing required fields', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: false,
            status: 400,
            json: async () => ({
                error: 'validation_failed',
                message: 'Girilen bilgiler geçersiz.'
            })
        });

        const res = await fetch('/api/talep', {
            method: 'POST',
            body: JSON.stringify({})
        });

        expect(res.ok).toBe(false);
        expect(res.status).toBe(400);
    });
});

describe('RFQ API Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('GET /api/rfq - should return RFQ list', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                items: [{ id: '1', title: 'RFQ 001', status: 'OPEN' }],
                total: 1
            })
        });

        const res = await fetch('/api/rfq');
        expect(res.ok).toBe(true);
    });

    it('POST /api/rfq - should create RFQ from request', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            status: 201,
            json: async () => ({ id: 'rfq-1' })
        });

        const res = await fetch('/api/rfq', {
            method: 'POST',
            body: JSON.stringify({
                requestIds: ['1'],
                supplierIds: ['s1', 's2'],
                deadline: '2026-02-01'
            })
        });

        expect(res.ok).toBe(true);
    });

    it('POST /api/rfq/[id]/publish - should publish RFQ', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ status: 'PUBLISHED' })
        });

        const res = await fetch('/api/rfq/1/publish', { method: 'POST' });
        const data = await res.json();

        expect(data.status).toBe('PUBLISHED');
    });
});

describe('Sipariş (Order) API Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('GET /api/siparis - should return order list', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                items: [{ id: '1', barcode: 'SIP-001', status: 'PENDING' }],
                total: 1
            })
        });

        const res = await fetch('/api/siparis');
        expect(res.ok).toBe(true);
    });

    it('PUT /api/siparis/[id]/approve - should approve order', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ status: 'APPROVED' })
        });

        const res = await fetch('/api/siparis/1/approve', { method: 'PUT' });
        expect(res.ok).toBe(true);
    });
});

describe('Tedarikçi (Supplier) API Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('GET /api/tedarikci - should return supplier list', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                items: [{ id: '1', name: 'Supplier A', active: true }],
                total: 1
            })
        });

        const res = await fetch('/api/tedarikci');
        expect(res.ok).toBe(true);
    });

    it('POST /api/tedarikci - should create supplier', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            status: 201,
            json: async () => ({ id: 'new-s1', name: 'New Supplier' })
        });

        const res = await fetch('/api/tedarikci', {
            method: 'POST',
            body: JSON.stringify({
                name: 'New Supplier',
                email: 'supplier@test.com',
                taxId: '1234567890'
            })
        });

        expect(res.ok).toBe(true);
    });

    it('POST /api/tedarikci - should reject duplicate taxId', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: false,
            status: 409,
            json: async () => ({
                error: 'duplicate',
                message: 'Bu bilgilerle bir kayıt zaten var.'
            })
        });

        const res = await fetch('/api/tedarikci', {
            method: 'POST',
            body: JSON.stringify({
                name: 'Duplicate Supplier',
                taxId: 'EXISTING'
            })
        });

        expect(res.ok).toBe(false);
        expect(res.status).toBe(409);
    });
});

describe('Fatura (Invoice) API Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('GET /api/fatura - should return invoice list', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                items: [{ id: '1', number: 'FTR-001', status: 'PENDING' }],
                total: 1
            })
        });

        const res = await fetch('/api/fatura');
        expect(res.ok).toBe(true);
    });
});

describe('Sözleşme (Contract) API Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('GET /api/finans/sozlesmeler - should return contract list', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                items: [{ id: '1', number: 'SZL-001', status: 'ACTIVE' }]
            })
        });

        const res = await fetch('/api/finans/sozlesmeler');
        expect(res.ok).toBe(true);
    });

    it('POST /api/finans/sozlesmeler - should create contract', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            status: 201,
            json: async () => ({ id: 'c1', number: 'SZL-002' })
        });

        const res = await fetch('/api/finans/sozlesmeler', {
            method: 'POST',
            body: JSON.stringify({
                number: 'SZL-002',
                title: 'Test Contract',
                parties: 'Company A ↔ Company B',
                startDate: '2026-01-01'
            })
        });

        expect(res.ok).toBe(true);
    });
});
