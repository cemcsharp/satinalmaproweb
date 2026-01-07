import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionApi } from "@/lib/apiAuth";
import { renderToBuffer } from "@react-pdf/renderer";
import InvoicePdf from "@/lib/pdf/templates/InvoicePdf";
import React from "react";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    try {
        // Permission check
        const user = await requirePermissionApi(req, "fatura:read");
        if (!user) {
            return NextResponse.json(
                { error: "forbidden", message: "PDF indirme yetkiniz yok." },
                { status: 403 }
            );
        }

        // Fetch invoice with all related data
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                order: {
                    include: {
                        supplier: true,
                        request: {
                            include: {
                                unit: true,
                            },
                        },
                    },
                },
                items: true,
            },
        });

        if (!invoice) {
            return NextResponse.json(
                { error: "not_found", message: "Fatura bulunamadı." },
                { status: 404 }
            );
        }

        // Prepare invoice items
        const items = (invoice.items || []).map((item: any) => ({
            name: item.name || "Kalem",
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            taxRate: item.taxRate || (invoice as any).vatRate || 20,
            totalPrice: (item.unitPrice || 0) * (item.quantity || 1),
        }));

        // Prepare PDF data
        const pdfData = {
            invoice: {
                number: invoice.number,
                orderNo: invoice.orderNo,
                createdAt: invoice.createdAt.toISOString(),
                dueDate: invoice.dueDate.toISOString(),
                status: invoice.status,
                amount: Number(invoice.amount),
                vatRate: (invoice as any).vatRate || 20,
                withholdingCode: (invoice as any).withholdingCode || undefined,
                bank: invoice.bank || undefined,
                items,
                order: invoice.order ? {
                    barcode: invoice.order.barcode,
                    supplier: invoice.order.supplier ? {
                        name: invoice.order.supplier.name,
                        address: invoice.order.supplier.address || undefined,
                        taxId: invoice.order.supplier.taxId || undefined,
                    } : undefined,
                    request: invoice.order.request ? {
                        subject: invoice.order.request.subject,
                        unit: invoice.order.request.unit ? { label: invoice.order.request.unit.label } : undefined,
                    } : undefined,
                } : undefined,
            },
            company: undefined, // Can be expanded to include company info
        };

        // Generate PDF
        const pdfBuffer = await renderToBuffer(
            React.createElement(InvoicePdf, pdfData) as any
        );

        // Return PDF response
        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="Fatura-${invoice.number}.pdf"`,
                "Cache-Control": "no-cache",
            },
        });
    } catch (error: any) {
        console.error("[Invoice PDF] Error:", error);
        return NextResponse.json(
            { error: "pdf_generation_failed", message: error.message },
            { status: 500 }
        );
    }
}
