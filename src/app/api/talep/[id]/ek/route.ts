import { NextRequest } from "next/server";
import { jsonError } from "@/lib/apiError";

// Attachments have been disabled per requirements.
export async function POST(_req: NextRequest, _ctx: { params: Promise<{ id: string }> }) {
  return jsonError(410, "attachments_disabled");
}