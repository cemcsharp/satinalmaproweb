import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserWithPermissions } from "@/lib/apiAuth";

// Turkish type labels
const TYPE_LABELS: Record<string, string> = {
    talep: "Talep",
    siparis: "Sipariş",
    sozlesme: "Sözleşme",
    fatura: "Fatura",
    tedarikci: "Tedarikçi",
};

// Status mappings for Turkish display
const STATUS_LABELS: Record<string, string> = {
    pending: "Beklemede",
    approved: "Onaylandı",
    rejected: "Reddedildi",
    completed: "Tamamlandı",
    active: "Aktif",
    cancelled: "İptal",
    draft: "Taslak",
};

export interface SearchResult {
    id: string;
    type: string;
    typeLabel: string;
    title: string;
    subtitle?: string;
    href: string;
    createdAt?: string;
}

export interface SearchResponse {
    results: SearchResult[];
    query: string;
    count: number;
    modules: {
        talep: number;
        siparis: number;
        sozlesme: number;
        fatura: number;
        tedarikci: number;
    };
}

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Genel arama
 *     description: Talepler, siparişler, sözleşmeler, faturalar ve tedarikçiler arasında eş zamanlı arama yapar.
 *     tags:
 *       - Search
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Arama terimi (en az 2 karakter)
 *       - in: query
 *         name: module
 *         required: false
 *         schema:
 *           type: string
 *           enum: [talep, siparis, sozlesme, fatura, tedarikci]
 *         description: Sadece belirli bir modülde arama yapmak için filtre
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 15
 *         description: Döndürülecek maksimum sonuç sayısı
 *     responses:
 *       200:
 *         description: Arama sonuçları başarılı bir şekilde döndürüldü
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SearchResponse'
 *       400:
 *         description: Geçersiz parametre veya eksik sorgu
 *       500:
 *         description: Sunucu hatası
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim();
    const moduleFilter = searchParams.get("module"); // Optional: filter by specific module
    const limitParam = parseInt(searchParams.get("limit") || "15", 10);
    const limit = Math.min(Math.max(limitParam, 1), 50); // Clamp between 1-50

    if (!query || query.length < 2) {
        return NextResponse.json({
            results: [],
            query: query,
            count: 0,
            modules: { talep: 0, siparis: 0, sozlesme: 0, fatura: 0, tedarikci: 0 },
        });
    }

    try {
        // Get current user to check permissions (optional - allows searching even if not logged in)
        const user = await getUserWithPermissions(request);
        const permissions = user?.permissions || [];

        // Determine which modules user can search based on permissions
        const canSearchTalep = !user || permissions.includes("talep:read") || user.role === "admin";
        const canSearchSiparis = !user || permissions.includes("siparis:read") || user.role === "admin";
        const canSearchSozlesme = !user || permissions.includes("sozlesme:read") || user.role === "admin";
        const canSearchFatura = !user || permissions.includes("fatura:read") || user.role === "admin";
        const canSearchTedarikci = !user || permissions.includes("tedarikci:read") || user.role === "admin";

        const results: SearchResult[] = [];
        const moduleCounters = { talep: 0, siparis: 0, sozlesme: 0, fatura: 0, tedarikci: 0 };
        const perModuleLimit = Math.ceil(limit / 5); // Distribute limit across modules

        // Run all searches in parallel for better performance
        const [requests, orders, contracts, invoices, suppliers] = await Promise.all([
            // Search Requests (Talepler)
            (!moduleFilter || moduleFilter === "talep") && canSearchTalep
                ? prisma.request.findMany({
                    where: {
                        OR: [
                            { barcode: { contains: query, mode: "insensitive" } },
                            { subject: { contains: query, mode: "insensitive" } },
                        ],
                    },
                    include: { status: true, unit: true },
                    take: perModuleLimit,
                    orderBy: { createdAt: "desc" },
                })
                : Promise.resolve([]),

            // Search Orders (Siparişler)
            (!moduleFilter || moduleFilter === "siparis") && canSearchSiparis
                ? prisma.order.findMany({
                    where: {
                        OR: [
                            { barcode: { contains: query, mode: "insensitive" } },
                            { refNumber: { contains: query, mode: "insensitive" } },
                        ],
                    },
                    include: { status: true, supplier: true },
                    take: perModuleLimit,
                    orderBy: { createdAt: "desc" },
                })
                : Promise.resolve([]),

            // Search Contracts (Sözleşmeler)
            (!moduleFilter || moduleFilter === "sozlesme") && canSearchSozlesme
                ? prisma.contract.findMany({
                    where: {
                        deletedAt: null, // Only active contracts
                        OR: [
                            { number: { contains: query, mode: "insensitive" } },
                            { title: { contains: query, mode: "insensitive" } },
                            { parties: { contains: query, mode: "insensitive" } },
                        ],
                    },
                    take: perModuleLimit,
                    orderBy: { createdAt: "desc" },
                })
                : Promise.resolve([]),

            // Search Invoices (Faturalar)
            (!moduleFilter || moduleFilter === "fatura") && canSearchFatura
                ? prisma.invoice.findMany({
                    where: {
                        OR: [
                            { number: { contains: query, mode: "insensitive" } },
                            { orderNo: { contains: query, mode: "insensitive" } },
                        ],
                    },
                    include: { order: { select: { barcode: true } } },
                    take: perModuleLimit,
                    orderBy: { createdAt: "desc" },
                })
                : Promise.resolve([]),

            // Search Suppliers (Tedarikçiler - using Tenant model)
            (!moduleFilter || moduleFilter === "tedarikci") && canSearchTedarikci
                ? prisma.tenant.findMany({
                    where: {
                        isActive: true,
                        isSupplier: true,
                        OR: [
                            { name: { contains: query, mode: "insensitive" } },
                            { taxId: { contains: query, mode: "insensitive" } },
                            { email: { contains: query, mode: "insensitive" } },
                            { contactName: { contains: query, mode: "insensitive" } },
                        ],
                    },
                    take: perModuleLimit,
                    orderBy: { name: "asc" },
                })
                : Promise.resolve([]),
        ]);

        // Process Requests
        for (const req of requests) {
            results.push({
                id: req.id,
                type: "talep",
                typeLabel: TYPE_LABELS.talep,
                title: `${req.barcode} - ${req.subject.slice(0, 50)}${req.subject.length > 50 ? "..." : ""}`,
                subtitle: `${req.unit?.label || ""} • ${req.status?.label || ""}`,
                href: `/talep/detay/${req.id}`,
                createdAt: req.createdAt.toISOString(),
            });
            moduleCounters.talep++;
        }

        // Process Orders
        for (const order of orders) {
            results.push({
                id: order.id,
                type: "siparis",
                typeLabel: TYPE_LABELS.siparis,
                title: order.barcode,
                subtitle: `${order.supplier?.name || "-"} • ${order.status?.label || ""}`,
                href: `/siparis/detay/${order.id}`,
                createdAt: order.createdAt.toISOString(),
            });
            moduleCounters.siparis++;
        }

        // Process Contracts
        for (const contract of contracts) {
            const statusLabel = STATUS_LABELS[contract.status.toLowerCase()] || contract.status;
            results.push({
                id: contract.id,
                type: "sozlesme",
                typeLabel: TYPE_LABELS.sozlesme,
                title: `${contract.number} - ${contract.title}`,
                subtitle: `${contract.parties?.slice(0, 40) || ""} • ${statusLabel}`,
                href: `/sozlesme/detay/${contract.id}`,
                createdAt: contract.createdAt.toISOString(),
            });
            moduleCounters.sozlesme++;
        }

        // Process Invoices
        for (const invoice of invoices) {
            const statusLabel = STATUS_LABELS[invoice.status.toLowerCase()] || invoice.status;
            results.push({
                id: invoice.id,
                type: "fatura",
                typeLabel: TYPE_LABELS.fatura,
                title: `Fatura #${invoice.number}`,
                subtitle: `${invoice.orderNo} • ${Number(invoice.amount).toLocaleString("tr-TR")} ₺ • ${statusLabel}`,
                href: `/fatura/detay/${invoice.id}`,
                createdAt: invoice.createdAt.toISOString(),
            });
            moduleCounters.fatura++;
        }

        // Process Suppliers
        for (const supplier of suppliers) {
            results.push({
                id: supplier.id,
                type: "tedarikci",
                typeLabel: TYPE_LABELS.tedarikci,
                title: supplier.name,
                subtitle: supplier.taxId ? `Vergi No: ${supplier.taxId}` : supplier.email || "",
                href: `/tedarikci/detay/${supplier.id}`,
                createdAt: supplier.createdAt.toISOString(),
            });
            moduleCounters.tedarikci++;
        }

        // Sort results by creation date (most recent first)
        results.sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        // Apply final limit
        const limitedResults = results.slice(0, limit);

        const response: SearchResponse = {
            results: limitedResults,
            query: query,
            count: limitedResults.length,
            modules: moduleCounters,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("[Search API] Error:", error);
        return NextResponse.json(
            {
                results: [],
                query: query,
                count: 0,
                modules: { talep: 0, siparis: 0, sozlesme: 0, fatura: 0, tedarikci: 0 },
                error: "Arama sırasında bir hata oluştu",
            },
            { status: 500 }
        );
    }
}
