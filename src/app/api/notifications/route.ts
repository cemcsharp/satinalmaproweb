import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notify, listNotifications } from "@/lib/notification-service";
import { requireAuthApi } from "@/lib/apiAuth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAuthApi(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const items = await listNotifications(String(auth.userId), 50);
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuthApi(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const title = String(body?.title || "").trim();
  const bodyText = String(body?.body || "").trim();
  const type = String(body?.type || "info");
  if (!title || !bodyText) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const created = await notify({ userId: String(auth.userId), title, body: bodyText, type: type as any });
  return NextResponse.json(created, { status: 201 });
}
