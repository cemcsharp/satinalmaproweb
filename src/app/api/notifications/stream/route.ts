import { NextRequest } from "next/server";
import { subscribe } from "@/lib/notification-service";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = (token as any)?.userId || (token as any)?.sub || null;
  if (!userId) return new Response(null, { status: 401 });
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let active = true;
      const push = (s: string) => { if (!active) return; controller.enqueue(encoder.encode(s)); };
      const send = (data: any) => {
        if (data.userId !== userId) return;
        push(`data: ${JSON.stringify(data)}\n\n`);
      };
      const unsub = subscribe(send);
      const ping = setInterval(() => {
        if (!active) return;
        try { push(`:ping\n\n`); } catch { try { active = false; clearInterval(ping); unsub(); } catch { } }
      }, 15000);
      try { (req as any).signal?.addEventListener?.("abort", () => { try { active = false; clearInterval(ping); unsub(); } catch { } }); } catch { }
      push(`:connected\n\n`);
      push(`retry: 5000\n\n`);
      push(`event: ready\n` + `data: ${JSON.stringify({ ok: true })}\n\n`);
      (controller as any)._cleanup = () => { active = false; clearInterval(ping); unsub(); };
    },
    cancel() {
      try { (this as any)._cleanup?.(); } catch { }
    }
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
}
