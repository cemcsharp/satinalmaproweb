import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const id = String(p?.id || "");
  if (!id) {
    return NextResponse.json({ code: "bad_request", message: "Geçersiz sözleşme ID" }, { status: 400 });
  }

  try {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        attachments: true,
        revisions: true,
        events: true,
      },
    });
    if (!contract) {
      return NextResponse.json({ code: "not_found", message: "Sözleşme bulunamadı" }, { status: 404 });
    }

    const now = new Date();
    const end = contract.endDate ? new Date(contract.endDate) : null;
    const start = contract.startDate ? new Date(contract.startDate) : null;
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysUntilEnd = end ? Math.ceil((end.getTime() - now.getTime()) / msPerDay) : null;
    const durationDays = start && end ? Math.ceil((end.getTime() - start.getTime()) / msPerDay) : null;
    const isExpired = end ? end.getTime() < now.getTime() : false;
    const hasPdf = (contract.attachments || []).some((a) => (a.mimeType || "").toLowerCase().includes("pdf"));
    const pendingRevisionCount = (contract.revisions || []).filter((r) => r.pending).length;
    const eventCount = (contract.events || []).length;

    const suggestions: string[] = [];
    if (!hasPdf) suggestions.push("PDF ekleri bulunmuyor. En az bir PDF ekleyin.");
    if (daysUntilEnd !== null && daysUntilEnd <= 30 && daysUntilEnd >= 0) suggestions.push("Bitiş tarihi yaklaşıyor. Yenileme planı oluşturun.");
    if (isExpired) suggestions.push("Sözleşme süresi dolmuş. Statüyü güncelleyin veya yenileyin.");
    if (pendingRevisionCount > 0) suggestions.push("Bekleyen revizyonlar var. İnceleyip onaylayın.");
    if (contract.status === "Taslak") suggestions.push("Sözleşme hâlâ Taslak. Onaya gönderin.");

    return NextResponse.json({
      id: contract.id,
      number: contract.number,
      title: contract.title,
      status: contract.status,
      version: contract.version,
      startDate: contract.startDate,
      endDate: contract.endDate,
      metrics: {
        daysUntilEnd,
        durationDays,
        isExpired,
        hasPdf,
        pendingRevisionCount,
        eventCount,
      },
      suggestions,
    });
  } catch (e) {
    console.error("contract_analyze_failed", e);
    return NextResponse.json({ code: "server_error", message: "Analiz başarısız" }, { status: 500 });
  }
}