import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

// Helper to get currency ID
const getCurrencyId = (curr: string) => {
    if (curr === "USD") return "c2";
    if (curr === "EUR") return "c3";
    return "c1"; // Default TRY
};

export async function POST(req: NextRequest) {
    try {
        const { getUserWithPermissions } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");

        // Body: { selections: { rfqItemId: string; offerId: string; quantity: number }[], rfqId: string }
        const body = await req.json();
        const { selections, rfqId, customOrderNumbers } = body;

        if (!selections || !Array.isArray(selections) || selections.length === 0) {
            return jsonError(400, "no_selections");
        }

        // Group selections by Offer (Supplier)
        const itemsByOffer = new Map<string, typeof selections>();
        for (const sel of selections) {
            if (!itemsByOffer.has(sel.offerId)) {
                itemsByOffer.set(sel.offerId, []);
            }
            itemsByOffer.get(sel.offerId)?.push(sel);
        }

        const createdOrderIds: string[] = [];

        await prisma.$transaction(async (tx: any) => {
            // Fetch RFQ to get related Request
            const rfq = await tx.rfq.findUnique({
                where: { id: rfqId },
                include: { requests: true }
            });
            const mainRequestId = rfq?.requests[0]?.id;

            // Get default company
            const defaultCompany = await tx.company.findFirst();
            const companyId = defaultCompany?.id || "co1"; // Fallback to seed ID

            // Process each offer group as a separate Order
            for (const [offerId, items] of itemsByOffer.entries()) {
                const offer = await tx.offer.findUnique({
                    where: { id: offerId },
                    include: {
                        rfqSupplier: { include: { supplier: true } },
                        items: true
                    }
                });

                if (!offer) throw new Error("Offer not found: " + offerId);

                // Ensure Supplier Exists (Onboarding)
                let supplierId = offer.rfqSupplier.supplierId;
                if (!supplierId) {
                    // Create new supplier from contact info
                    const contactName = offer.rfqSupplier.contactName || "Bilinmeyen Tedarikçi";
                    const companyName = offer.rfqSupplier.companyName; // New field
                    const email = offer.rfqSupplier.email;

                    // Prioritize company name for Supplier Name
                    const supplierName = companyName || (contactName + " (RFQ)");

                    // Check if exists by email first to avoid dupes
                    const existingSup = await tx.supplier.findUnique({ where: { email } });
                    if (existingSup) {
                        supplierId = existingSup.id;
                    } else {
                        const newSup = await tx.supplier.create({
                            data: {
                                name: supplierName,
                                email: email,
                                contactName: contactName,
                                active: true
                            }
                        });
                        supplierId = newSup.id;
                        // Link back to RfqSupplier
                        await tx.rfqSupplier.update({
                            where: { id: offer.rfqSupplier.id },
                            data: { supplierId: newSup.id }
                        });
                    }
                }

                let orderTotal = 0;
                const orderItemsData = [];

                for (const sel of items) {
                    const offerItem = offer.items.find((i: any) => i.rfqItemId === sel.rfqItemId);
                    if (!offerItem) continue;

                    const qty = Number(sel.quantity);
                    const unitPrice = Number(offerItem.unitPrice);
                    const lineTotal = qty * unitPrice;

                    orderTotal += lineTotal;

                    // Fetch RFQ Item linked to RequestItem to get SKU?
                    const rfqItem = await tx.rfqItem.findUnique({
                        where: { id: sel.rfqItemId }
                    });

                    // Try to find SKU via RequestItem if possible
                    let skuText = null;
                    if (rfqItem?.requestItemId) {
                        const reqItem = await tx.requestItem.findUnique({
                            where: { id: rfqItem.requestItemId },
                            include: { product: true } // Assuming link to product
                        });
                        skuText = reqItem?.sku || reqItem?.product?.sku || null;
                    }
                    // Fallback: If rfqItem has description that looks like SKU? Or just leave null.
                    // User wants SKU filled if possible.

                    orderItemsData.push({
                        name: rfqItem?.name || "Ürün",
                        sku: skuText, // New Field
                        quantity: qty,
                        unitPrice: unitPrice,
                        // Will use connect for unit
                    });
                }

                // Generate Unique Barcode
                const barcode = `SIP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

                // Determine Reference Number (Manual)
                let refNumber = null;
                if (customOrderNumbers && customOrderNumbers[offerId]) {
                    refNumber = customOrderNumbers[offerId];
                }

                // Get default option IDs from database
                const statusOption = await tx.optionItem.findFirst({
                    where: { category: { key: "siparisDurumu" }, active: true },
                    orderBy: { sort: "asc" }
                });
                const methodOption = await tx.optionItem.findFirst({
                    where: { category: { key: "alimYontemi" }, active: true },
                    orderBy: { sort: "asc" }
                });
                const regulationOption = await tx.optionItem.findFirst({
                    where: { category: { key: "yonetmelikMaddesi" }, active: true },
                    orderBy: { sort: "asc" }
                });
                const currencyOption = await tx.optionItem.findFirst({
                    where: {
                        category: { key: "paraBirimi" },
                        active: true,
                        label: offer.currency || "TRY"
                    }
                }) || await tx.optionItem.findFirst({
                    where: { category: { key: "paraBirimi" }, active: true },
                    orderBy: { sort: "asc" }
                });
                const unitOption = await tx.optionItem.findFirst({
                    where: { category: { key: "birimTipi" }, active: true },
                    orderBy: { sort: "asc" }
                });

                if (!statusOption || !methodOption || !regulationOption || !currencyOption) {
                    throw new Error("Gerekli sistem seçenekleri eksik. Lütfen Ayarlar > Listeler sayfasından kontrol edin.");
                }

                // Create Order
                const order = await tx.order.create({
                    data: {
                        barcode: barcode,
                        refNumber: refNumber, // Map to new field
                        status: { connect: { id: statusOption.id } },
                        method: { connect: { id: methodOption.id } },
                        regulation: { connect: { id: regulationOption.id } },
                        currency: { connect: { id: currencyOption.id } },
                        supplier: { connect: { id: supplierId } },
                        company: { connect: { id: companyId } },
                        realizedTotal: orderTotal,
                        ...(mainRequestId ? { request: { connect: { id: mainRequestId } } } : {}),
                        items: {
                            create: orderItemsData.map((d: any) => ({
                                name: d.name,
                                sku: d.sku,
                                quantity: d.quantity,
                                unitPrice: d.unitPrice,
                                ...(unitOption ? { unit: { connect: { id: unitOption.id } } } : {})
                            }))
                        }
                    }
                });

                createdOrderIds.push(order.id);

                // Phase 3: Budget Transition (Reserved -> Spent)
                // If the request has a department and budget, move the order total
                if (mainRequestId && orderTotal > 0) {
                    const request = await tx.request.findUnique({
                        where: { id: mainRequestId },
                        include: { department: true }
                    });

                    if (request?.departmentId) {
                        const currentYear = new Date().getFullYear();
                        const budgetRecord = await tx.budget.findFirst({
                            where: {
                                departmentId: request.departmentId,
                                year: currentYear
                            }
                        });

                        if (budgetRecord) {
                            await tx.budget.update({
                                where: { id: budgetRecord.id },
                                data: {
                                    reservedAmount: { decrement: orderTotal },
                                    spentAmount: { increment: orderTotal }
                                }
                            });
                        }
                    }
                }
            }

            // Update RFQ Status
            await tx.rfq.update({
                where: { id: rfqId },
                data: { status: "COMPLETED" }
            });
        });

        return NextResponse.json({ ok: true, orderIds: createdOrderIds });

    } catch (e: any) {
        console.error("Split order error:", e);
        return jsonError(500, e.message || "server_error");
    }
}
