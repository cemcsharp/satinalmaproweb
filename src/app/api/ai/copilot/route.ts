import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";
import { requirePermissionApi } from "@/lib/apiAuth";

/**
 * POST /api/ai/copilot
 * Procurement Assistant - Doğal Dil Sorgu İşleme Laboratuvarı
 */
export async function POST(req: NextRequest) {
    try {
        const user = await requirePermissionApi(req, "request:view");
        if (!user) return jsonError(403, "forbidden");

        const { message } = await req.json();
        const query = message.toLowerCase();

        let response = "";
        let data: any = null;

        // 1. Bütçe Sorguları (Örn: "Bütçem ne durumda?", "Kalan bütçem?")
        if (query.includes("bütçe") || query.includes("para") || query.includes("limit")) {
            const budgets = await prisma.departmentBudget.findMany({
                where: { tenantId: user.tenantId, year: new Date().getFullYear() },
                select: { departmentName: true, totalAmount: true, spentAmount: true, reservedAmount: true }
            });

            if (budgets.length > 0) {
                const total = budgets.reduce((a, b) => a + Number(b.totalAmount), 0);
                const spent = budgets.reduce((a, b) => a + Number(b.spentAmount), 0);
                const perc = ((spent / total) * 100).toFixed(1);
                response = `Şu anki bütçe durumunuz: Toplam bütçenizin %${perc} kısmını (${spent.toLocaleString("tr-TR")} TL) kullandınız. Detaylı bakmak isterseniz Bütçe Konsolu'na yönlendirebilirim.`;
                data = budgets;
            } else {
                response = "Henüz tanımlı bir bütçeniz görünmüyor. Finans birimi ile görüşmenizi öneririm.";
            }
        }

        // 2. Tedarikçi Sorguları (Örn: "En iyi tedarikçiler?", "Kime güvenmeliyim?")
        else if (query.includes("tedarikçi") || query.includes("firma") || query.includes("güven")) {
            const topSuppliers = await prisma.supplier.findMany({
                where: { active: true, score: { gte: 80 } },
                orderBy: { score: "desc" },
                take: 3
            });

            if (topSuppliers.length > 0) {
                const names = topSuppliers.map(s => s.name).join(", ");
                response = `Performans verilerine göre en güvenilir iş ortaklarınız: ${names}. Bu firmalar hız ve kalite konusunda Gold segmentindedir.`;
                data = topSuppliers;
            } else {
                response = "Tedarikçi performans verileriniz analiz ediliyor. Henüz Gold segmentinde bir firma bulunamadı.";
            }
        }

        // 3. Sipariş Sorguları (Örn: "Geciken işler?", "Bekleyen sipariş?")
        else if (query.includes("sipariş") || query.includes("geciken") || query.includes("bekleyen")) {
            const delayedOrders = await prisma.order.findMany({
                where: {
                    tenantId: user.tenantId,
                    status: { label: { in: ["Onaylandı", "Hazırlanıyor"] } },
                    estimatedDelivery: { lt: new Date() }
                },
                take: 3
            });

            if (delayedOrders.length > 0) {
                response = `Şu an teslimat tarihi geçmiş ${delayedOrders.length} adet siparişiniz bulunuyor. İlgili tedarikçilerle iletişime geçmek ister misiniz?`;
                data = delayedOrders;
            } else {
                response = "Harika! Şu an için termin süresi geçmiş acil bir siparişiniz görünmüyor.";
            }
        }

        // 4. Default / Fallback (AI Greeting)
        else {
            response = `Selam ${user.name}! Ben Satınalma Copilot'un. Bütçe durumun, tedarikçi performansları veya geciken siparişlerin hakkında bana istediğini sorabilirsin. Sana nasıl yardımcı olabilirim?`;
        }

        return NextResponse.json({
            reply: response,
            context: data,
            timestamp: new Date().toISOString()
        });

    } catch (e: any) {
        console.error("[Copilot API] Error:", e);
        return jsonError(500, "server_error", { message: e.message });
    }
}
