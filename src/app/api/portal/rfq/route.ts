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
                        items: {
                            include: { category: true }
                        }
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

        // Determine if onboarding is needed (no linked supplier OR missing critical info like IBAN)
        let needsOnboarding = false;
        let supplierData = null;
        let isRegistered = false;

        if (rfqSupplier.supplierId) {
            supplierData = await prisma.tenant.findUnique({
                where: { id: rfqSupplier.supplierId, isSupplier: true }
            });
            // Only require onboarding if supplier is NOT approved and missing critical info
            // Approved suppliers should go directly to offer form
            if (supplierData && supplierData.registrationStatus === 'approved') {
                needsOnboarding = false;
            } else if (!supplierData || !supplierData.bankIban || !supplierData.taxOffice) {
                needsOnboarding = true;
            }
        } else {
            // Check if supplier exists by email even if not linked yet
            supplierData = await prisma.tenant.findUnique({
                where: { email: rfqSupplier.email, isSupplier: true }
            });
            // If supplier exists and is approved, no onboarding needed
            if (supplierData && supplierData.registrationStatus === 'approved') {
                needsOnboarding = false;
            } else {
                needsOnboarding = true;
            }
        }

        // Check if a User account actually exists for this email
        const userAccount = await prisma.user.findUnique({
            where: { email: rfqSupplier.email || "" }
        });
        isRegistered = !!userAccount;

        // Return limited data (public safe)
        return NextResponse.json({
            ok: true,
            rfq: {
                id: rfqSupplier.rfqId,
                title: rfqSupplier.rfq.title,
                rfxCode: rfqSupplier.rfq.rfxCode,
                deadline: rfqSupplier.rfq.deadline,
                status: rfqSupplier.rfq.status,
                items: rfqSupplier.rfq.items.map(i => ({
                    id: i.id,
                    name: i.name,
                    quantity: Number(i.quantity),
                    unit: i.unit,
                    categoryId: i.categoryId,
                    categoryName: i.category?.name || null,
                    categoryCode: i.category?.code || null
                }))
            },
            supplier: supplierData ? {
                id: supplierData.id,
                name: supplierData.name,
                email: supplierData.email,
                taxId: supplierData.taxId,
                taxOffice: supplierData.taxOffice,
                contactName: supplierData.contactName,
                phone: supplierData.phone,
                address: supplierData.address,
                website: supplierData.website,
                notes: supplierData.notes,
                bankName: supplierData.bankName,
                bankBranch: supplierData.bankBranch,
                bankIban: supplierData.bankIban,
                bankAccountNo: supplierData.bankAccountNo,
                bankCurrency: supplierData.bankCurrency,
                commercialRegistrationNo: supplierData.commercialRegistrationNo,
                mersisNo: supplierData.mersisNo
            } : {
                name: rfqSupplier.contactName,
                email: rfqSupplier.email,
                companyName: rfqSupplier.companyName
            },
            needsOnboarding,
            isRegistered,
            existingOffer: rfqSupplier.offer // If they already submitted, return it
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
                rfq: {
                    include: {
                        items: true,
                        rfqMessages: {
                            include: {
                                author: { select: { name: true, email: true } },
                                rfqSupplier: { select: { companyName: true } }
                            },
                            orderBy: { createdAt: "asc" }
                        }
                    }
                },
                offer: { include: { items: true } }
            }
        });

        if (!rfqSupplier) return jsonError(404, "invitation_not_found");
        if (new Date() > rfqSupplier.tokenExpiry) return jsonError(410, "token_expired");
        if (rfqSupplier.rfq.status !== "ACTIVE") return jsonError(400, "rfq_closed");

        // Check for explicit "onboard" action
        const action = req.nextUrl.searchParams.get("action");

        if (action === "onboard") {
            const {
                name, taxId, taxOffice, contactName, phone, address, website, notes,
                bankName, bankBranch, bankIban, bankAccountNo, bankCurrency,
                commercialRegistrationNo, mersisNo, password
            } = await req.json();

            // 1. Check if Supplier exists by Email
            let supplierId: string;
            const existingSupplier = await prisma.tenant.findUnique({
                where: { email: rfqSupplier.email, isSupplier: true }
            });

            // 1.1 Check Conflicts (Name or TaxID) with OTHER suppliers
            const conflicts = await prisma.tenant.findMany({
                where: {
                    isSupplier: true,
                    OR: [
                        { name: name },
                        { taxId: taxId ? taxId : undefined }
                    ],
                    NOT: existingSupplier ? { id: existingSupplier.id } : {}
                }
            });

            if (conflicts.length > 0) {
                // Determine which field conflicted
                const names = conflicts.map(c => c.name);
                if (names.includes(name)) return NextResponse.json({ error: "Bu 'Firma Adı' ile kayıtlı başka bir tedarikçi zaten var." }, { status: 400 });
                // If not name, it must be taxId
                return NextResponse.json({ error: "Bu 'Vergi No' ile kayıtlı başka bir tedarikçi zaten var." }, { status: 400 });
            }

            const supplierData = {
                name,
                taxId,
                taxOffice,
                contactName,
                phone,
                address,
                website,
                notes,
                bankName,
                bankBranch,
                bankIban,
                bankAccountNo,
                bankCurrency,
                commercialRegistrationNo,
                mersisNo,
                isActive: true,
                isSupplier: true
            };

            if (existingSupplier) {
                // Update existing
                const updated = await prisma.tenant.update({
                    where: { id: existingSupplier.id },
                    data: supplierData
                });
                supplierId = updated.id;
            } else {
                // Create new
                const newSupplier = await prisma.tenant.create({
                    data: {
                        ...supplierData,
                        email: rfqSupplier.email,
                        slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                        isBuyer: false
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

            // 3. Create/Update User Account (Corporate Account System)
            if (password && password.length >= 6) {
                const { hashPassword } = await import("@/lib/auth");
                const hashedPassword = await hashPassword(password);

                await prisma.user.upsert({
                    where: { email: rfqSupplier.email || "" },
                    update: {
                        passwordHash: hashedPassword,
                        tenantId: supplierId
                    },
                    create: {
                        username: rfqSupplier.email || `sup_${supplierId.slice(-6)}`,
                        email: rfqSupplier.email,
                        passwordHash: hashedPassword,
                        tenantId: supplierId,
                        isActive: true
                    }
                });
            }

            return NextResponse.json({ ok: true, supplierId: supplierId });
        }

        if (action === "send_message") {
            const { content } = await req.json();
            if (!content || !content.trim()) return jsonError(400, "no_content");

            const msg = await prisma.rfqMessage.create({
                data: {
                    rfqId: rfqSupplier.rfqId,
                    rfqSupplierId: rfqSupplier.id,
                    content: content.trim(),
                    isFromSupplier: true
                }
            });

            return NextResponse.json({ ok: true, message: msg });
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

        const {
            items, notes, validUntil, currency, attachments, companyName,
            incoterm, paymentTerm, extraCostPackaging, extraCostLogistics,
            shippingIncluded, deliveryDays, partialDelivery, validityDays, generalWarranty
        } = body;

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
            technicalSpecs?: string;
            isAlternative?: boolean;
            warranty?: string;
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
                brand: item.brand,
                technicalSpecs: item.technicalSpecs,
                isAlternative: !!item.isAlternative,
                warranty: item.warranty
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
                    incoterm: incoterm || null,
                    paymentTerm: paymentTerm || null,
                    extraCostPackaging: extraCostPackaging ? Number(extraCostPackaging) : 0,
                    extraCostLogistics: extraCostLogistics ? Number(extraCostLogistics) : 0,
                    shippingIncluded: shippingIncluded ?? false,
                    deliveryDays: deliveryDays ? Number(deliveryDays) : null,
                    partialDelivery: partialDelivery ?? false,
                    validityDays: validityDays ? Number(validityDays) : 30,
                    generalWarranty: generalWarranty || null,
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
