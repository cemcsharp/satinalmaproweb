import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").toLowerCase().trim();

    if (!query) {
        return NextResponse.json({ results: [] });
    }

    const results: Array<{
        id: string;
        type: string;
        title: string;
        subtitle?: string;
        href: string;
    }> = [];

    try {
        // Search in Requests (Talepler)
        const requests = await prisma.request.findMany({
            where: {
                OR: [
                    { barcode: { contains: query, mode: "insensitive" } },
                    { subject: { contains: query, mode: "insensitive" } },
                ],
            },
            include: {
                status: true,
                unit: true,
            },
            take: 5,
            orderBy: { createdAt: "desc" },
        });

        for (const req of requests) {
            results.push({
                id: req.id,
                type: "talep",
                title: `${req.barcode} - ${req.subject.slice(0, 50)}${req.subject.length > 50 ? "..." : ""}`,
                subtitle: `${req.unit?.label || ""} - ${req.status?.label || ""}`,
                href: `/talep/detay/${req.id}`,
            });
        }

        // Search in Orders (Siparişler)
        const orders = await prisma.order.findMany({
            where: {
                barcode: { contains: query, mode: "insensitive" },
            },
            include: {
                status: true,
                supplier: true,
            },
            take: 5,
            orderBy: { createdAt: "desc" },
        });

        for (const order of orders) {
            results.push({
                id: order.id,
                type: "siparis",
                title: `${order.barcode}`,
                subtitle: `Tedarikçi: ${order.supplier?.name || "-"} - ${order.status?.label || ""}`,
                href: `/siparis/detay/${order.id}`,
            });
        }

        // Search in Contracts (Sözleşmeler)
        const contracts = await prisma.contract.findMany({
            where: {
                OR: [
                    { number: { contains: query, mode: "insensitive" } },
                    { title: { contains: query, mode: "insensitive" } },
                    { parties: { contains: query, mode: "insensitive" } },
                ],
            },
            take: 5,
            orderBy: { createdAt: "desc" },
        });

        for (const contract of contracts) {
            results.push({
                id: contract.id,
                type: "sozlesme",
                title: `${contract.number} - ${contract.title}`,
                subtitle: `${contract.parties?.slice(0, 40) || ""} - ${contract.status}`,
                href: `/sozlesme/detay/${contract.id}`,
            });
        }

        // Search in Invoices (Faturalar)
        const invoices = await prisma.invoice.findMany({
            where: {
                OR: [
                    { number: { contains: query, mode: "insensitive" } },
                    { orderNo: { contains: query, mode: "insensitive" } },
                ],
            },
            take: 5,
            orderBy: { createdAt: "desc" },
        });

        for (const invoice of invoices) {
            results.push({
                id: invoice.id,
                type: "fatura",
                title: `Fatura #${invoice.number}`,
                subtitle: `Sipariş: ${invoice.orderNo} - ${Number(invoice.amount).toLocaleString("tr-TR")} ₺ - ${invoice.status}`,
                href: `/fatura/detay/${invoice.id}`,
            });
        }

        // Search in Suppliers (Tedarikçiler)
        const suppliers = await prisma.supplier.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { taxId: { contains: query, mode: "insensitive" } },
                    { email: { contains: query, mode: "insensitive" } },
                    { contactName: { contains: query, mode: "insensitive" } },
                ],
            },
            take: 5,
            orderBy: { name: "asc" },
        });

        for (const supplier of suppliers) {
            results.push({
                id: supplier.id,
                type: "tedarikci",
                title: supplier.name,
                subtitle: supplier.taxId ? `Vergi No: ${supplier.taxId}` : supplier.email || "",
                href: `/tedarikci/detay/${supplier.id}`,
            });
        }

        // Limit total results
        const limitedResults = results.slice(0, 10);

        return NextResponse.json({ results: limitedResults });
    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 });
    }
}
