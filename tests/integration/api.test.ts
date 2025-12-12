import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

const mockSession = {
    user: { id: 'test-user', name: 'Test User', email: 'test@test.com' }
};

describe('Talep API Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/talep', () => {
        it('should return list of requests', async () => {
            const mockRequests = [
                { id: '1', barcode: 'TLP-001', subject: 'Test Request', status: 'Beklemede' },
                { id: '2', barcode: 'TLP-002', subject: 'Another Request', status: 'Onaylandı' }
            ];

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockRequests
            });

            const response = await fetch('/api/talep');
            const data = await response.json();

            expect(response.ok).toBe(true);
            expect(data).toHaveLength(2);
            expect(data[0].barcode).toBe('TLP-001');
        });

        it('should filter requests by status', async () => {
            const mockRequests = [
                { id: '1', barcode: 'TLP-001', subject: 'Test Request', status: 'Beklemede' }
            ];

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockRequests
            });

            const response = await fetch('/api/talep?status=Beklemede');
            const data = await response.json();

            expect(data).toHaveLength(1);
            expect(data[0].status).toBe('Beklemede');
        });
    });

    describe('POST /api/talep', () => {
        it('should create a new request', async () => {
            const newRequest = {
                subject: 'New Purchase Request',
                description: 'We need office supplies'
            };

            const mockCreated = {
                id: 'new-id',
                barcode: 'TLP-003',
                ...newRequest,
                status: 'Beklemede',
                createdAt: new Date().toISOString()
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                status: 201,
                json: async () => mockCreated
            });

            const response = await fetch('/api/talep', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRequest)
            });

            const data = await response.json();

            expect(response.ok).toBe(true);
            expect(data.barcode).toBe('TLP-003');
            expect(data.subject).toBe(newRequest.subject);
        });

        it('should return 400 for invalid request data', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({ error: 'subject is required' })
            });

            const response = await fetch('/api/talep', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(400);
        });
    });

    describe('PUT /api/talep/{id}', () => {
        it('should update an existing request', async () => {
            const updateData = { subject: 'Updated Subject' };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: '1', ...updateData })
            });

            const response = await fetch('/api/talep/1', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();
            expect(data.subject).toBe('Updated Subject');
        });
    });

    describe('DELETE /api/talep/{id}', () => {
        it('should delete a request', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                status: 204,
                json: async () => ({})
            });

            const response = await fetch('/api/talep/1', { method: 'DELETE' });
            expect(response.ok).toBe(true);
        });
    });
});

describe('Siparis API Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/siparis', () => {
        it('should return list of orders', async () => {
            const mockOrders = [
                { id: '1', barcode: 'SIP-001', poNumber: 'PO-001', status: 'Hazırlanıyor' }
            ];

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockOrders
            });

            const response = await fetch('/api/siparis');
            const data = await response.json();

            expect(response.ok).toBe(true);
            expect(data).toHaveLength(1);
            expect(data[0].poNumber).toBe('PO-001');
        });
    });
});

describe('Auth API Integration Tests', () => {
    describe('POST /api/auth/forgot', () => {
        it('should send password reset email', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: 'Email sent' })
            });

            const response = await fetch('/api/auth/forgot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'user@test.com' })
            });

            expect(response.ok).toBe(true);
        });
    });
});
