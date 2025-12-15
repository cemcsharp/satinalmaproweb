import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

export async function POST(req: NextRequest) {
    try {
        const { getUserWithPermissions, userHasPermission } = await import("@/lib/apiAuth");
        const user = await getUserWithPermissions(req);
        if (!user) return jsonError(401, "unauthorized");
        if (!userHasPermission(user, "siparis:create")) return jsonError(403, "forbidden");

        const body = await req.json();
        const { rfqId, offerId, companyId } = body;
        // companyId: Need to know which internal company (firmamız) is buying? Often linked to Request Unit or selected manually.
        // For now let's pick the first existing company or pass it.

        if (!rfqId || !offerId) return jsonError(400, "missing_params");

        // Fetch details
        const rfq = await prisma.rfq.findUnique({
            where: { id: rfqId },
            include: { requests: true }
        });
        if (!rfq) return jsonError(404, "rfq_not_found");
        if (rfq.status !== "ACTIVE") return jsonError(400, "rfq_not_active");

        const offer = await prisma.offer.findUnique({
            where: { id: offerId },
            include: { rfqSupplier: { include: { supplier: true } }, items: true }
        });
        if (!offer) return jsonError(404, "offer_not_found");
        if (offer.rfqSupplier.rfqId !== rfqId) return jsonError(400, "mismatch");

        // Determine buying company (Assume first active company for MVP or from request unit relation if we had it mapped)
        let finalCompanyId = companyId;
        if (!finalCompanyId) {
            const comp = await prisma.company.findFirst({ where: { active: true } });
            finalCompanyId = comp?.id;
        }
        if (!finalCompanyId) return jsonError(400, "no_company_defined");

        // Also need to handle Supplier relation.
        // The Offer comes from RfqSupplier. 
        // If RfqSupplier is linked to a system Supplier, good.
        // If NOT (it was just email), we must CREATE a Supplier record now! (Onboarding)

        let supplierId = offer.rfqSupplier.supplierId;
        if (!supplierId) {
            // Auto-create supplier from RFQ contact info
            const newSup = await prisma.supplier.create({
                data: {
                    name: offer.rfqSupplier.contactName || offer.rfqSupplier.email,
                    email: offer.rfqSupplier.email,
                    active: true,
                    notes: "RFQ sistemi üzerinden otomatik oluşturuldu."
                }
            });
            supplierId = newSup.id;
            // Optionally link it back
            await prisma.rfqSupplier.update({ where: { id: offer.rfqSupplier.id }, data: { supplierId } });
        }

        // Create Order
        // We aggregate items. If multiple requests, we might create multiple orders OR one order with relation to one MAIN request or multiple.
        // Schema: Order has `requestId` (String?). It's singular.
        // So if RFQ bundles multiple requests, we have a problem mapping 1 Order to N Requests.
        // Solution: Create 1 Order, link to the FIRST request (or main). Or change schema.
        // For MVP: Link to first request.
        const mainRequestId = rfq.requests[0]?.id;

        // Generate Order Number Code or Barcode
        const orderBarcode = `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

        // Status: Pending Approval? Or directly Approved?
        // Let's say "Taslak" or "Onay Bekliyor" (Pending).
        // Start with pending status (ID needed). Fetch or assume known seed.
        const status = await prisma.optionItem.findFirst({ where: { category: { key: "siparisDurumu" }, active: true }, orderBy: { sort: "asc" } });
        const method = await prisma.optionItem.findFirst({ where: { category: { key: "alimYontemi" }, active: true }, orderBy: { sort: "asc" } });
        // Fallbacks
        const statusId = status?.id;
        const methodId = method?.id;
        const regulationId = (await prisma.optionItem.findFirst({ where: { category: { key: "yonetmelikMaddesi" }, active: true }, orderBy: { sort: "asc" } }))?.id;
        const currencyOpt = await prisma.optionItem.findFirst({ where: { category: { key: "paraBirimi" }, active: true, label: offer.currency } });
        const currencyId = currencyOpt?.id || (await prisma.optionItem.findFirst({ where: { category: { key: "paraBirimi" }, active: true }, orderBy: { sort: "asc" } }))?.id;

        if (!statusId || !methodId || !regulationId || !currencyId) return jsonError(500, "missing_config_options");

        // Items map
        // We need to map OfferItems to OrderItems.
        // OfferItem -> RfqItem -> RequestItem (optional)
        // OrderItem needs `unitId`.
        // RfqItem has `unit` string. OrderItem needs `unitId` (Relation).
        // We should try to find unit by label or set null.

        // For now simple map.

        const rfqItems = await prisma.rfqItem.findMany({ where: { rfqId } });

        // Get default unit for fallback
        const defaultUnit = await prisma.optionItem.findFirst({
            where: { category: { key: "birimTipi" }, active: true },
            orderBy: { sort: "asc" }
        });

        const orderItemsData = [];
        for (const oi of offer.items) {
            const rfqI = rfqItems.find(r => r.id === oi.rfqItemId);
            const rfqUnit = rfqI?.unit; // string
            // find unit option by label
            const unitOpt = rfqUnit
                ? await prisma.optionItem.findFirst({
                    where: { category: { key: "birimTipi" }, label: rfqUnit }
                })
                : null;

            orderItemsData.push({
                name: rfqI?.name || "Ürün",
                quantity: oi.quantity,
                unitPrice: oi.unitPrice,
                unitId: unitOpt?.id || defaultUnit?.id, // Use default if not found
                // extraCosts?
            });
        }

        const order = await prisma.order.create({
            data: {
                barcode: orderBarcode,
                requestId: mainRequestId,
                supplierId: supplierId,
                companyId: finalCompanyId,
                statusId,
                methodId,
                regulationId,
                currencyId,
                realizedTotal: offer.totalAmount, // or sum
                responsibleUserId: user.id,
                items: {
                    create: orderItemsData
                }
            }
        });

        // Mark RFQ Completed
        await prisma.rfq.update({
            where: { id: rfqId },
            data: { status: "COMPLETED" }
        });

        // Mark Offer as Winner
        await prisma.offer.update({
            where: { id: offerId },
            data: { isWinner: true }
        });

        return NextResponse.json({ ok: true, orderId: order.id, barcode: orderBarcode });

    } catch (e: any) {
        console.error(e);
        return jsonError(500, "server_error", { message: e.message });
    }
}
