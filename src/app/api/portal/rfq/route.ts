import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

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
                offers: {
                    orderBy: { round: 'desc' },
                    take: 1,
                    include: { items: true }
                }
            }
        }) as any;

        if (!rfqSupplier) return jsonError(404, "invitation_not_found");

        // Auth Unification: If logged in, tenantId must match
        const { getUserWithPermissions } = await import("@/lib/apiAuth");
        const auth = await getUserWithPermissions(req);
        if (auth && auth.tenantId && rfqSupplier.supplierId && auth.tenantId !== rfqSupplier.supplierId) {
            console.warn(`[Portal Security] GET Tenant mismatch: User ${auth.id} (Tenant: ${auth.tenantId}) tried to access Token belonging to Supplier ${rfqSupplier.supplierId}`);
            return jsonError(403, "supplier_mismatch", { message: "Bu teklif daveti başka bir firmaya aittir. Lütfen kendi hesabınızla giriş yapınız." });
        }

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

        // Determine if onboarding is needed
        let needsOnboarding = false;
        let supplierData = null;
        let isRegistered = false;

        if (rfqSupplier.supplierId) {
            supplierData = await prisma.tenant.findUnique({
                where: { id: rfqSupplier.supplierId }
            });
            if (supplierData && supplierData.registrationStatus === 'approved') {
                needsOnboarding = false;
            } else if (!supplierData || !supplierData.bankIban || !supplierData.taxOffice) {
                needsOnboarding = true;
            }
        } else {
            supplierData = await prisma.tenant.findFirst({
                where: { email: rfqSupplier.email, isSupplier: true }
            });
            if (supplierData && supplierData.registrationStatus === 'approved') {
                needsOnboarding = false;
            } else {
                needsOnboarding = true;
            }
        }

        const userAccount = await prisma.user.findUnique({
            where: { email: rfqSupplier.email || "" }
        });
        isRegistered = !!userAccount;

        return NextResponse.json({
            ok: true,
            rfq: {
                id: rfqSupplier.rfqId,
                title: rfqSupplier.rfq.title,
                rfxCode: rfqSupplier.rfq.rfxCode,
                deadline: rfqSupplier.rfq.deadline,
                status: rfqSupplier.rfq.status,
                items: rfqSupplier.rfq.items.map((i: any) => ({
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
            existingOffer: rfqSupplier.offers?.[0] || null
        });

    } catch (e) {
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
                        messages: {
                            include: {
                                author: { select: { username: true, email: true } },
                                rfqSupplier: { select: { companyName: true } }
                            },
                            orderBy: { createdAt: "asc" }
                        }
                    }
                },
                offers: { orderBy: { round: 'desc' }, take: 1, include: { items: true } }
            }
        }) as any;

        if (!rfqSupplier) return jsonError(404, "invitation_not_found");

        // Auth Unification: If logged in, tenantId must match
        const { getUserWithPermissions } = await import("@/lib/apiAuth");
        const auth = await getUserWithPermissions(req);
        if (auth && auth.tenantId && rfqSupplier.supplierId && auth.tenantId !== rfqSupplier.supplierId) {
            console.warn(`[Portal Security] POST Tenant mismatch: User ${auth.id} (Tenant: ${auth.tenantId}) tried to access Token belonging to Supplier ${rfqSupplier.supplierId}`);
            return jsonError(403, "supplier_mismatch", { message: "Bu işlem başka bir firmaya aittir. Lütfen kendi hesabınızla giriş yapınız." });
        }

        if (new Date() > rfqSupplier.tokenExpiry) return jsonError(410, "token_expired");
        if (rfqSupplier.rfq.status !== "ACTIVE") return jsonError(400, "rfq_closed");

        // Check for explicit "onboard" action
        const action = req.nextUrl.searchParams.get("action");

        if (action === "onboard") {
            const onboardBody = await req.json();
            const {
                name, taxId, taxOffice, contactName, phone, address, website, notes,
                bankName, bankBranch, bankIban, bankAccountNo, bankCurrency,
                commercialRegistrationNo, mersisNo, password
            } = onboardBody;

            // 1. Check if Supplier exists by Email
            let supplierId: string;
            const existingSupplier = await prisma.tenant.findFirst({
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
                const names = conflicts.map(c => c.name);
                if (names.includes(name)) return NextResponse.json({ error: "Bu 'Firma Adı' ile kayıtlı başka bir tedarikçi zaten var." }, { status: 400 });
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
                mersisNo: mersisNo || null,
                isActive: true,
                isSupplier: true
            };

            if (existingSupplier) {
                const updated = await prisma.tenant.update({
                    where: { id: existingSupplier.id },
                    data: supplierData
                });
                supplierId = updated.id;
            } else {
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

            await prisma.rfqSupplier.update({
                where: { id: rfqSupplier.id },
                data: {
                    supplierId: supplierId,
                    companyName: name
                }
            });

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
        const {
            items, notes: offerNotes, validUntil, currency, attachments, companyName,
            incoterm, paymentTerm, extraCostPackaging, extraCostLogistics,
            shippingIncluded, deliveryDays, partialDelivery, validityDays, generalWarranty
        } = body;

        if (!Array.isArray(items) || items.length === 0) return jsonError(400, "no_items");

        let totalAmount = 0;
        const offerItemsData: any[] = [];

        for (const item of items) {
            const qty = Number(item.quantity || 0);
            const price = Number(item.unitPrice || 0);
            const lineTotal = qty * price;
            totalAmount += lineTotal;

            offerItemsData.push({
                rfqItemId: item.rfqItemId,
                quantity: qty,
                unitPrice: price,
                vatRate: Number(item.vatRate || 20),
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
            const existingOffer = rfqSupplier.offers?.[0];

            if (existingOffer) {
                const dateStr = new Date().toLocaleString("tr-TR");
                const existingLogs = existingOffer.notes ? existingOffer.notes.split("--- GEÇMİŞ REVİZYONLAR ---")[1] : "";
                let detailsLog = "";

                if (existingOffer.items && existingOffer.items.length > 0) {
                    detailsLog = "\nDeğişiklikler:";
                    for (const oldItem of existingOffer.items) {
                        const newItem = items.find((i: any) => i.rfqItemId === oldItem.rfqItemId);
                        if (newItem) {
                            const oldPrice = Number(oldItem.unitPrice);
                            const newPrice = Number(newItem.unitPrice || 0);
                            if (oldPrice !== newPrice) {
                                const rfqItem = rfqSupplier.rfq.items.find((ri: any) => ri.id === oldItem.rfqItemId);
                                detailsLog += `\n- ${rfqItem?.name || "Ürün"}: ${oldPrice.toLocaleString("tr-TR")} -> ${newPrice.toLocaleString("tr-TR")} ${currency}`;
                            }
                        }
                    }
                    if (detailsLog === "\nDeğişiklikler:") detailsLog = "";
                }

                currentLog = `\n\n[Revizyon: ${dateStr}]\nEski Toplam: ${Number(existingOffer.totalAmount).toLocaleString("tr-TR")} ${existingOffer.currency}${detailsLog}`;
                previousLog = "--- GEÇMİŞ REVİZYONLAR ---" + currentLog + (existingLogs || "");

                await tx.offer.delete({ where: { id: existingOffer.id } });
            }

            const offer = await tx.offer.create({
                data: {
                    rfqSupplierId: rfqSupplier.id,
                    totalAmount,
                    currency: currency || "TRY",
                    validUntil: validUntil ? new Date(validUntil) : null,
                    notes: (offerNotes || "") + (previousLog ? "\n\n" + previousLog : ""),
                    attachments: attachments || null,
                    items: { create: offerItemsData },
                    incoterm: incoterm || null,
                    paymentTerm: paymentTerm || null,
                    extraCostPackaging: extraCostPackaging ? Number(extraCostPackaging) : 0,
                    extraCostLogistics: extraCostLogistics ? Number(extraCostLogistics) : 0,
                    shippingIncluded: shippingIncluded ?? false,
                    deliveryDays: deliveryDays ? Number(deliveryDays) : null,
                    partialDelivery: partialDelivery ?? false,
                    validityDays: validityDays ? Number(validityDays) : 30,
                    generalWarranty: generalWarranty || null,
                    submittedAt: new Date(),
                    round: rfqSupplier.rfq.negotiationRound
                }
            });

            await tx.rfqSupplier.update({
                where: { id: rfqSupplier.id },
                data: {
                    stage: "OFFERED",
                    ...(companyName ? { companyName: String(companyName).trim() } : {})
                }
            });

            return offer;
        });

        return NextResponse.json({ ok: true, id: result.id });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || "server_error" }, { status: 500 });
    }
}
