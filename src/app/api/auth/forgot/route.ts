import { NextRequest, NextResponse } from "next/server";
import { signResetToken } from "@/lib/auth";
import { jsonError } from "@/lib/apiError";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = String(body?.userId || body?.userIdOrEmail || "").trim();
    if (!userId) return jsonError(400, "invalid_payload");
    const token = signResetToken({ userId });
    const origin = req.nextUrl.origin;
    const resetUrl = `${origin}/login/reset/${token}`;
    // Production: burada e-posta gönderimi yapılır.
    return NextResponse.json({ ok: true, resetUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonError(500, "server_error", { message });
  }
}