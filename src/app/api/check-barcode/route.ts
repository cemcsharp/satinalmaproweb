import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthApi } from "@/lib/apiAuth";

export async function GET(req: NextRequest) {
  const auth = await requireAuthApi(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const barcode = url.searchParams.get("barcode") || "";
  const type = (url.searchParams.get("type") || "request") as "request" | "order";
  if (!barcode) return NextResponse.json({ unique: false, reason: "barcode_required" }, { status: 400 });
  try {
    const code = barcode.trim();
    if (type === "order") {
      const found = await prisma.order.findUnique({ where: { barcode: code } });
      return NextResponse.json({ unique: !Boolean(found) });
    } else {
      const found = await prisma.request.findUnique({ where: { barcode: code } });
      return NextResponse.json({ unique: !Boolean(found) });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ unique: false, reason: "db_error" }, { status: 500 });
  }
}