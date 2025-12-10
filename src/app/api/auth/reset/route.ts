import { NextRequest, NextResponse } from "next/server";
import { verifyResetToken, setUserPassword } from "@/lib/auth";
import { jsonError } from "@/lib/apiError";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token") || "";
    const payload = verifyResetToken(token);
    if (!payload) return NextResponse.json({ valid: false }, { status: 400 });
    return NextResponse.json({ valid: true, userId: payload.userId });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = String(body?.token || "");
    const newPassword = String(body?.newPassword || "");
    const payload = verifyResetToken(token);
    if (!payload) return jsonError(400, "invalid_token");
    if (newPassword.length < 4) return jsonError(400, "weak_password");
    setUserPassword(payload.userId, newPassword);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonError(500, "server_error", { message });
  }
}