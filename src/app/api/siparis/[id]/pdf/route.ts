import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionApi } from "@/lib/apiAuth";
import { renderToBuffer } from "@react-pdf/renderer";
import OrderPdf from "@/lib/pdf/templates/OrderPdf";
import React from "react";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    try {
        // Permission check
        const user = await requirePermissionApi(req, "siparis:read");
        if (!user) {
            return NextResponse.json(
                { error: "forbidden", message: "PDF indirme yetkiniz yok." },
                { status: 403 }
            );
        }

        // Fetch order with all related data
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                supplier: true,
                request: {
                    include: {
                        unit: true,
                        items: true,
                    },
                },
                responsible: true,
                company: true,
                items: true,
            },
        });

        if (!order) {
            return NextResponse.json(
                { error: "not_found", message: "Sipariş bulunamadı." },
                { status: 404 }
            );
        }

        // Prepare order items
        const items = (order.items || order.request?.items || []).map((item: any) => ({
            name: item.name || item.productName || "Ürün",
            quantity: item.quantity || 1,
            unit: item.unit || item.unitLabel || "Adet",
            unitPrice: item.unitPrice || 0,
            totalPrice: (item.unitPrice || 0) * (item.quantity || 1),
        }));

        const subtotal = items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
        const vatRate = 20; // Default VAT rate
        const vatAmount = subtotal * (vatRate / 100);
        const grandTotal = subtotal + vatAmount;

        // Prepare PDF data
        const pdfData = {
            order: {
                barcode: order.barcode,
                createdAt: order.createdAt.toISOString(),
                status: (order as any).status || "Beklemede",
                regulationRef: (order as any).regulationRef || undefined,
                officialDocNo: (order as any).officialDocNo || undefined,
                notes: (order as any).notes || undefined,
                items,
                subtotal,
                vatAmount,
                grandTotal,
                currency: (order as any).currency || "TL",
                supplier: order.supplier ? {
                    name: order.supplier.name,
                    address: order.supplier.address || undefined,
                    taxId: order.supplier.taxId || undefined,
                } : undefined,
                request: order.request ? {
                    subject: order.request.subject,
                    unit: order.request.unit ? { label: order.request.unit.label } : undefined,
                } : undefined,
                responsible: order.responsible ? {
                    username: order.responsible.username,
                } : undefined,
            },
            company: order.company ? {
                name: order.company.name,
                address: (order.company as any).address || undefined,
                taxId: (order.company as any).taxId || undefined,
            } : undefined,
        };

        // Generate PDF
        const pdfBuffer = await renderToBuffer(
            React.createElement(OrderPdf, pdfData) as any
        );

        // Return PDF response
        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="Siparis-${order.barcode}.pdf"`,
                "Cache-Control": "no-cache",
            },
        });
    } catch (error: any) {
        console.error("[Order PDF] Error:", error);
        return NextResponse.json(
            { error: "pdf_generation_failed", message: error.message },
            { status: 500 }
        );
    }
}
