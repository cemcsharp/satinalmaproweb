import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { requirePermissionApi } from "@/lib/apiAuth";
import { dispatchEmail, renderEmailTemplate } from "@/lib/mailer";

import crypto from "crypto";

// Helper for token generation
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

export async function POST(req: NextRequest) {
    try {
        // Permission check: rfq:create required
        const user = await requirePermissionApi(req, "rfq:create");
        if (!user) return jsonError(403, "forbidden", { message: "RFQ oluşturma yetkiniz yok." });

        const body = await req.json();
        const { title, deadline, requestIds, suppliers, itemCategories, companyId, deliveryAddressId } = body;

        if (!title || !Array.isArray(requestIds) || requestIds.length === 0 || !Array.isArray(suppliers) || suppliers.length === 0) {
            return jsonError(400, "missing_fields");
        }

        // 1. Fetch Requests and their Items
        const requests = await prisma.request.findMany({
            where: { id: { in: requestIds } },
            include: { items: true, unit: true }
        });

        if (requests.length === 0) return jsonError(404, "requests_not_found");

        // 2. Prepare Data
        const primaryBarcode = requests[0].barcode;
        const baseCode = `RFQ-${primaryBarcode}`;
        let rfxCode = baseCode;

        // Ensure Uniqueness: Check if any RFQ starts with this baseCode
        // Note: This is a basic check. High concurrency might still cause conflict, but acceptable for this scale.
        const existingCount = await prisma.rfq.count({
            where: {
                rfxCode: { startsWith: baseCode }
            }
        });

        if (existingCount > 0) {
            rfxCode = `${baseCode}-${existingCount + 1}`;
        }

        const deadlineDate = deadline ? new Date(deadline) : null;

        // Aggregate Items (Simple approach: List all items. Advanced: Merge same items)
        // We will list all items and keep reference to origin request item
        const rfqItemsData = [];
        for (const req of requests) {
            if (req.items) {
                for (const item of req.items) {
                    // Find unit label if possible, or just use string
                    // item.unitId is an ID. We need label ideally. 
                    // For now let's hope we can get unit info or better, assume unitId is mostly consistent or we look it up.
                    // Actually `requestItem.unit` relation exists.
                    // Since we didn't include `unit` in `items`, let's just use unitId or fetch it?
                    // Optimized: include unit in items query.
                    rfqItemsData.push({
                        name: item.name,
                        quantity: item.quantity,
                        unit: item.unitId, // We store ID or we should store Label? Schema says String. Let's store ID for now or fetch label.
                        // Schema: unit String. If we store ID, UI needs to resolve. 
                        // Better: Store Label if possible. But `RequestItem` has `unitId` relation.
                        // Let's rely on Prisma to fetch it if we include it.
                        requestItemId: item.id
                    });
                }
            }
        }

        // 3. Create RFQ Transaction
        // Needs to fetch unit labels for items first
        // Let's do a refetch or use what we have. 
        // `requests` includes `items`. Let's assume we can tolerate unitId in string field or we fix it.
        // Actually, `RfqItem` `unit` is String. It's better to store Label like "Adet", "Kg".
        // I will refetch items with unit Relation.

        const requestItemsWithUnit = await prisma.requestItem.findMany({
            where: { requestId: { in: requestIds } },
            include: { unit: true }
        });

        const finalRfqItems = requestItemsWithUnit.map(ri => ({
            name: ri.name,
            quantity: ri.quantity,
            unit: ri.unit?.label || "Birim",
            description: `Talep No: ${requests.find(r => r.id === ri.requestId)?.barcode}`,
            requestItemId: ri.id,
            categoryId: itemCategories ? itemCategories[ri.id] || null : null
        }));

        const result = await prisma.$transaction(async (tx) => {
            // Create RFQ
            const rfq = await tx.rfq.create({
                data: {
                    rfxCode,
                    title,
                    deadline: deadlineDate,
                    createdById: user.id,
                    companyId: companyId || null,
                    deliveryAddressId: deliveryAddressId || null,
                    items: {
                        create: finalRfqItems
                    },
                    // Connect requests
                    requests: {
                        connect: requestIds.map(id => ({ id }))
                    }
                }
            });

            // Create Suppliers and Tokens
            const supplierInvites = [];
            for (const sup of suppliers) {
                // sup: { id?, email, name? }
                // If ID exists, connect. If not, just store email/name.
                const token = generateToken();
                const tokenExpiry = new Date();
                tokenExpiry.setDate(tokenExpiry.getDate() + 7); // 7 days validity

                const invite = await tx.rfqSupplier.create({
                    data: {
                        rfqId: rfq.id,
                        supplierId: sup.id || null,
                        email: sup.email,
                        contactName: sup.name || sup.contactName || "Tedarikçi",
                        token,
                        tokenExpiry
                    }
                });
                supplierInvites.push(invite);
            }

            return { rfq, supplierInvites };
        });

        // 4. Send Emails (Async)
        (async () => {
            try {
                const origin = req.nextUrl.origin;
                for (const invite of result.supplierInvites) {
                    const link = `${origin}/portal/rfq/${invite.token}`;
                    const html = renderEmailTemplate("generic", {
                        title: `Fiyat Teklifi İsteği: ${result.rfq.rfxCode}`,
                        body: `<p>Sayın ${invite.contactName},</p>
                   <p><strong>${title}</strong> için fiyat teklifinizi bekliyoruz.</p>
                   <p style="background-color:#fffbeb; border:1px solid #fcd34d; padding:12px; border-radius:6px; margin:16px 0;">
                     <strong style="color:#b45309;">⚠️ ÖNEMLİ:</strong> <span style="color:#92400e;">Tüm fiyatlar <strong>KDV HARİÇ</strong> olarak girilmelidir. Kurumumuz teklif değerlendirmelerini KDV hariç fiyatlar üzerinden yapmaktadır.</span>
                   </p>
                   <p>Aşağıdaki bağlantıya tıklayarak teklifinizi doğrudan sisteme girebilirsiniz:</p>
                   <p>Son Teklif Tarihi: ${deadlineDate ? deadlineDate.toLocaleDateString("tr-TR") : "Belirtilmedi"}</p>`,
                        actionUrl: link,
                        actionText: "Teklif Ver"
                    });
                    await dispatchEmail({
                        to: invite.email,
                        subject: `Teklif İsteği: ${result.rfq.rfxCode} - ${title}`,
                        html,
                        category: "rfq_invite"
                    });
                }
            } catch (e) {
                console.error("Email dispatch failed", e);
            }
        })();

        return NextResponse.json({ ok: true, id: result.rfq.id, rfxCode: result.rfq.rfxCode });

    } catch (e: any) {
        console.error("RFQ Create Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}

export async function GET(req: NextRequest) {
    try {
        // Permission check: rfq:read required
        const user = await requirePermissionApi(req, "rfq:read");
        if (!user) return jsonError(403, "forbidden", { message: "RFQ görüntüleme yetkiniz yok." });

        const { searchParams } = new URL(req.url);
        const page = Number(searchParams.get("page") || 1);
        const take = 20;
        const skip = (page - 1) * take;

        // Admin ve satınalma müdürü tüm RFQ'ları görür
        // Diğer kullanıcılar sadece kendi taleplerinin RFQ'larını görür
        const isFullAccess = user.isAdmin;

        // WHERE koşulu oluştur
        let whereClause: any = {};

        if (!isFullAccess) {
            // Birim kullanıcısı: Sadece kendi taleplerinin RFQ'larını gör
            // RFQ -> Request ilişkisi üzerinden ownerUserId kontrolü
            whereClause = {
                requests: {
                    some: {
                        ownerUserId: user.id
                    }
                }
            };
        }

        const [items, total] = await Promise.all([
            prisma.rfq.findMany({
                where: whereClause,
                skip, take,
                orderBy: { createdAt: "desc" },
                include: {
                    _count: { select: { suppliers: true, items: true } },
                    suppliers: { select: { id: true, stage: true, supplier: { select: { name: true } }, email: true, offer: { select: { totalAmount: true, currency: true } } } },
                    requests: { select: { id: true, barcode: true, subject: true, ownerUserId: true } }
                }
            }),
            prisma.rfq.count({ where: whereClause })
        ]);

        return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / take) });

    } catch (e) {
        console.error("RFQ GET Error:", e);
        return jsonError(500, "server_error");
    }
}
