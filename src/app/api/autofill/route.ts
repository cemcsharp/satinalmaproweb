import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

function toNum(x: unknown): number {
  const obj = x as { toNumber?: () => number } | number | string | null | undefined;
  if (obj && typeof (obj as any).toNumber === "function") {
    return (obj as any).toNumber();
  }
  return Number(obj as number | string);
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "contract"; // contract | invoice
    const supplierId = url.searchParams.get("supplierId") || undefined;
    const companyId = url.searchParams.get("companyId") || undefined;
    const orderId = url.searchParams.get("orderId") || undefined;

    if (type === "contract") {
      // Son sipariş ve varsa son sözleşme bilgileri
      const lastOrder = await prisma.order.findFirst({
        where: { OR: [supplierId ? { supplierId } : {}, companyId ? { companyId } : {}] },
        orderBy: { createdAt: "desc" },
        include: { method: true, currency: true },
      });
      let lastContract: Awaited<ReturnType<typeof prisma.contract.findFirst>> = null;
      if (orderId) {
        lastContract = await prisma.contract.findFirst({ where: { orderId }, orderBy: { createdAt: "desc" } });
      }
      return NextResponse.json({
        lastOrder: lastOrder
          ? {
              id: lastOrder.id,
              barcode: lastOrder.barcode,
              total: toNum((lastOrder as unknown as { realizedTotal?: unknown }).realizedTotal),
              method: lastOrder.method?.label || "",
              currency: lastOrder.currency?.label || "",
              date: lastOrder.createdAt.toISOString(),
            }
          : null,
        lastContract: lastContract
          ? {
              id: lastContract.id,
              number: lastContract.number,
              title: lastContract.title,
              status: lastContract.status,
              version: lastContract.version,
            }
          : null,
      });
    }

    if (type === "invoice") {
      if (!orderId) return jsonError(400, "orderId_required");
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      const lastInvoice = await prisma.invoice.findFirst({ where: { orderId }, orderBy: { createdAt: "desc" } });
      return NextResponse.json({
        order: order
          ? {
              id: order.id,
              barcode: order.barcode,
              total: toNum((order as unknown as { realizedTotal?: unknown }).realizedTotal),
              createdAt: order.createdAt.toISOString(),
            }
          : null,
        lastInvoice: lastInvoice
          ? {
              id: lastInvoice.id,
              number: lastInvoice.number,
              amount: toNum((lastInvoice as unknown as { amount?: unknown }).amount),
              dueDate: lastInvoice.dueDate.toISOString(),
              status: lastInvoice.status,
              bank: lastInvoice.bank ?? null,
            }
          : null,
      });
    }

    return jsonError(400, "invalid_type");
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(message);
    return jsonError(500, "autofill_failed");
  }
}