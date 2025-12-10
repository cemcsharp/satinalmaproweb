import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/apiError";

function parseIntSafe(val: string | null, def: number): number {
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sort = (url.searchParams.get("sort") || "latest").toLowerCase();
    const supplierId = url.searchParams.get("supplierId") || undefined;
    const from = url.searchParams.get("from") || undefined; // ISO date
    const to = url.searchParams.get("to") || undefined; // ISO date
    const scoringType = (url.searchParams.get("scoringType") || "").trim().toLowerCase() || undefined;
    const q = (url.searchParams.get("q") || "").trim() || undefined; // supplier name search
    const page = parseIntSafe(url.searchParams.get("page"), 1);
    const pageSize = Math.min(parseIntSafe(url.searchParams.get("pageSize"), 20), 100);

    const where: any = {};
    if (supplierId) where.supplierId = supplierId;
    if (q) {
      where.supplier = { name: { contains: q, mode: "insensitive" } };
    }
    if (scoringType) {
      where.answers = { some: { question: { scoringType: { code: scoringType } } } };
    }
    if (from || to) {
      const range: any = {};
      if (from) range.gte = new Date(from);
      if (to) {
        // include entire day for 'to'
        const d = new Date(to);
        d.setHours(23, 59, 59, 999);
        range.lte = d;
      }
      where.submittedAt = range;
    }

    const orderBy = (() => {
      switch (sort) {
        case "highest":
          return [{ totalScore: "desc" }, { submittedAt: "desc" }];
        case "lowest":
          return [{ totalScore: "asc" }, { submittedAt: "desc" }];
        case "oldest":
          return [{ submittedAt: "asc" }];
        case "latest":
        default:
          return [{ submittedAt: "desc" }];
      }
    })();

    const [total, records] = await Promise.all([
      prisma.supplierEvaluation.count({ where }),
      prisma.supplierEvaluation.findMany({
        where,
        orderBy: orderBy as any,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          supplier: { select: { id: true, name: true } },
          order: { select: { id: true, barcode: true } },
          answers: {
            where: { value: { not: "" } },
            include: { question: { select: { type: true } } },
          },
        },
      }),
    ]);

    const items = records.map((ev) => {
      const commentAns = ev.answers.find((a) => a.question?.type === "text" && String(a.value || "").trim() !== "");
      return {
        id: ev.id,
        supplierId: ev.supplierId,
        supplierName: ev.supplier?.name || "",
        orderId: ev.orderId,
        orderBarcode: ev.order?.barcode || null,
        totalScore: ev.totalScore ? Number(ev.totalScore) : 0,
        submittedAt: ev.submittedAt,
        comment: commentAns ? String(commentAns.value) : null,
      };
    });

    const hasMore = page * pageSize < total;
    return NextResponse.json({ page, pageSize, total, hasMore, items });
  } catch (e: any) {
    return jsonError(500, "server_error", { message: e?.message });
  }
}