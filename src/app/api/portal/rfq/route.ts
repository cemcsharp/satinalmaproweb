import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { dispatchEmail, renderEmailTemplate } from "@/lib/mailer";

// GET: Fetch RFQ details by Token
export async function GET(req: NextRequest) {
    try {
        const token = req.nextUrl.searchParams.get("token");
        if (!token) return jsonError(400, "missing_token");

        const rfqSupplier = await prisma.rfqSupplier.findUnique({
            where: { token },
            include: {
                rfq: {
                    include: {
                        items: true
                    }
                },
                offer: {
                    include: { items: true }
                }
            }
        });

        if (!rfqSupplier) return jsonError(404, "invitation_not_found");

        // Check expiry
        if (new Date() > rfqSupplier.tokenExpiry) {
            return jsonError(410, "token_expired");
        }

        if (rfqSupplier.stage === "PENDING") {
            // Update stage to VIEWED
            await prisma.rfqSupplier.update({
                where: { id: rfqSupplier.id },
                data: { stage: "VIEWED" }
            });
        }

        // Return limited data (public safe)
        return NextResponse.json({
            ok: true,
            rfq: {
                title: rfqSupplier.rfq.title,
                rfxCode: rfqSupplier.rfq.rfxCode,
                deadline: rfqSupplier.rfq.deadline,
                items: rfqSupplier.rfq.items.map(i => ({
                    id: i.id,
                    name: i.name,
                    quantity: Number(i.quantity),
                    unit: i.unit,
                    description: i.description
                }))
            },
            supplier: {
                name: rfqSupplier.contactName,
                email: rfqSupplier.email,
                companyName: rfqSupplier.companyName
            },
            needsOnboarding: !rfqSupplier.supplierId, // If no linked supplier, we need onboarding
            existingOffer: rfqSupplier.offer // If they already submitted, return it (so they can edit possibly, or just view)
        });

    } catch (e: any) {
        console.error(e);
        return jsonError(500, "server_error");
    }
}

// POST: Submit Offer
export async function POST(req: NextRequest) {
    try {
        const token = req.nextUrl.searchParams.get("token");
        if (!token) return jsonError(400, "missing_token");

        // Fetch RFQ Supplier Context First
        const rfqSupplier = await prisma.rfqSupplier.findUnique({
            where: { token },
            include: {
                rfq: { include: { items: true } },
                offer: { include: { items: true } }
            }
        });

        if (!rfqSupplier) return jsonError(404, "invitation_not_found");
        if (new Date() > rfqSupplier.tokenExpiry) return jsonError(410, "token_expired");
        if (rfqSupplier.rfq.status !== "ACTIVE") return jsonError(400, "rfq_closed");

        // Check for explicit "onboard" action
        const action = req.nextUrl.searchParams.get("action");

        if (action === "onboard") {
            // --- ONBOARDING FLOW ---
            const { name, taxId, contactName, phone, address, website, notes } = await req.json();

            // 1. Check if Supplier exists by Email
            let supplierId: string;
            const existingSupplier = await prisma.supplier.findUnique({
                where: { email: rfqSupplier.email }
            });

            // 1.1 Check Conflicts (Name or TaxID) with OTHER suppliers
            const conflicts = await prisma.supplier.findMany({
                where: {
                    OR: [
                        { name: name },
                        { taxId: taxId ? taxId : undefined } // Only check if taxId is provided
                    ],
                    NOT: existingSupplier ? { id: existingSupplier.id } : {} // Exclude self if updating
                }
            });

            if (conflicts.length > 0) {
                // Determine which field conflicted
                const names = conflicts.map(c => c.name);
                if (names.includes(name)) return NextResponse.json({ error: "Bu 'Firma Adı' ile kayıtlı başka bir tedarikçi zaten var." }, { status: 400 });
                // If not name, it must be taxId
                return NextResponse.json({ error: "Bu 'Vergi No' ile kayıtlı başka bir tedarikçi zaten var." }, { status: 400 });
            }

            if (existingSupplier) {
                // Update existing
                const updated = await prisma.supplier.update({
                    where: { id: existingSupplier.id },
                    data: {
                        name: name,
                        taxId,
                        contactName,
                        phone,
                        address,
                        website,
                        notes: notes,
                        active: true
                    }
                });
                supplierId = updated.id;
            } else {
                // Create new
                const newSupplier = await prisma.supplier.create({
                    data: {
                        name: name,
                        taxId,
                        contactName,
                        email: rfqSupplier.email,
                        phone,
                        address,
                        website,
                        notes: notes,
                        active: true
                    }
                });
                supplierId = newSupplier.id;
            }

            // 2. Link to RfqSupplier
            await prisma.rfqSupplier.update({
                where: { id: rfqSupplier.id },
                data: {
                    supplierId: supplierId,
                    companyName: name
                }
            });

            return NextResponse.json({ ok: true, supplierId: supplierId });
        }

        // --- OFFER SUBMISSION FLOW (Default) ---
        const body = await req.json();
        /*
          Body: {
             notes: string,
             validUntil: date,
             items: [ { rfqItemId: string, unitPrice: number, currency: string, ... } ]
          }
        */

        // allow overwriting offer? Yes.
        // If offer exists, update or delete/recreate. Delete/recreate is easier for items.

        const { items, notes, validUntil, currency, attachments, companyName } = body;

        if (!Array.isArray(items) || items.length === 0) return jsonError(400, "no_items");

        // Calculate total
        let totalAmount = 0;
        const offerItemsData: Array<{
            rfqItemId: string;
            quantity: number;
            unitPrice: number;
            vatRate: number;
            totalPrice: number;
            notes?: string;
            brand?: string;
        }> = [];

        for (const item of items) {
            const qty = Number(item.quantity || 0);
            const price = Number(item.unitPrice || 0);
            const vat = Number(item.vatRate || 20);
            const lineTotal = qty * price;
            totalAmount += lineTotal;

            offerItemsData.push({
                rfqItemId: item.rfqItemId,
                quantity: qty,
                unitPrice: price,
                vatRate: vat,
                totalPrice: lineTotal,
                notes: item.notes,
                brand: item.brand
            });
        }

        const result = await prisma.$transaction(async (tx) => {
            let previousLog = "";

            // Delete existing offer if any
            if (rfqSupplier.offer) {
                const old = rfqSupplier.offer;
                const dateStr = new Date().toLocaleString("tr-TR");

                // Extract existing logs if any
                const existingLogs = old.notes ? old.notes.split("--- GEÇMİŞ REVİZYONLAR ---")[1] : "";

                let detailsLog = "";
                // Compare items
                if (old.items && old.items.length > 0) {
                    detailsLog = "\nDeğişiklikler:";
                    for (const oldItem of old.items) {
                        const newItem = items.find((i: any) => i.rfqItemId === oldItem.rfqItemId);
                        if (newItem) {
                            const oldPrice = Number(oldItem.unitPrice);
                            const newPrice = Number(newItem.unitPrice || 0);

                            if (oldPrice !== newPrice) {
                                // Find Item Name
                                const rfqItem = rfqSupplier.rfq.items.find((ri: any) => ri.id === oldItem.rfqItemId);
                                const itemName = rfqItem ? rfqItem.name : "Ürün";
                                detailsLog += `\n- ${itemName}: ${oldPrice.toLocaleString("tr-TR")} -> ${newPrice.toLocaleString("tr-TR")} ${currency}`;
                            }
                        }
                    }
                    if (detailsLog === "\nDeğişiklikler:") detailsLog = ""; // No changes detected
                }

                const currentLog = `\n\n[Revizyon: ${dateStr}]\nEski Toplam: ${Number(old.totalAmount).toLocaleString("tr-TR")} ${old.currency}${detailsLog}`;

                previousLog = "--- GEÇMİŞ REVİZYONLAR ---" + currentLog + (existingLogs || "");

                await tx.offer.delete({ where: { id: rfqSupplier.offer.id } });
            }

            // Combine notes
            const finalNotes = (notes || "") + (previousLog ? "\n\n" + previousLog : "");

            // Create Offer
            const offer = await tx.offer.create({
                data: {
                    rfqSupplierId: rfqSupplier.id,
                    totalAmount: totalAmount,
                    currency: currency || "TRY",
                    validUntil: validUntil ? new Date(validUntil) : null,
                    notes: finalNotes,
                    attachments: attachments || null, // Save file URLs
                    items: {
                        create: offerItemsData
                    },
                    submittedAt: new Date()
                }
            });

            // Update Stage and Company Name
            await tx.rfqSupplier.update({
                where: { id: rfqSupplier.id },
                data: {
                    stage: "OFFERED",
                    ...(companyName ? { companyName: String(companyName).trim() } : {})
                }
            });

            return offer;
        });

        // Notify Admins? (Optional)

        return NextResponse.json({ ok: true, id: result.id });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || "server_error" }, { status: 500 });
    }
}
