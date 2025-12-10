import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.user?.id || null;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let pref = await prisma.notificationPreference.findUnique({ where: { userId: String(userId) } }).catch(() => null);
  if (!pref) {
    pref = await prisma.notificationPreference.create({ data: { userId: String(userId) } });
  }
  return NextResponse.json(pref);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.user?.id || null;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const emailEnabled = body?.emailEnabled == null ? undefined : Boolean(body.emailEnabled);
  const inAppEnabled = body?.inAppEnabled == null ? undefined : Boolean(body.inAppEnabled);
  const digestEnabled = body?.digestEnabled == null ? undefined : Boolean(body.digestEnabled);
  const pref = await prisma.notificationPreference.upsert({
    where: { userId: String(userId) },
    update: { emailEnabled, inAppEnabled, digestEnabled },
    create: { userId: String(userId), emailEnabled: Boolean(emailEnabled ?? true), inAppEnabled: Boolean(inAppEnabled ?? true), digestEnabled: Boolean(digestEnabled ?? false) },
  });
  return NextResponse.json(pref);
}
