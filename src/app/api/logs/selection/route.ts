import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { jsonError } from "@/lib/apiError";
import { promises as fs } from "fs";
import path from "path";

// Log user selections for ISO 9001 traceability
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    const userId = (session as any)?.user?.id || (session as any)?.userId || "unknown";
    const body = await req.json().catch(() => ({}));
    const event = String(body?.event || "selection");
    const page = String(body?.page || "unknown");
    const context = body?.context ?? {};

    const record = {
      ts: new Date().toISOString(),
      userId,
      event,
      page,
      context,
    };
    const logsDir = path.join(process.cwd(), "logs", "iso9001");
    const filePath = path.join(logsDir, "selection.jsonl");
    await fs.mkdir(logsDir, { recursive: true });
    await fs.appendFile(filePath, JSON.stringify(record) + "\n", { encoding: "utf8" });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return jsonError(500, "log_write_failed", { message: e?.message });
  }
}