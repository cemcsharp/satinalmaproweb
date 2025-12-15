import { NextRequest } from "next/server";

const channels = new Map<string, Set<(data: string) => void>>();

function subscribe(id: string, cb: (data: string) => void) {
  if (!channels.has(id)) channels.set(id, new Set());
  channels.get(id)!.add(cb);
  return () => channels.get(id)!.delete(cb);
}

export function publish(id: string, event: string, payload: any) {
  const set = channels.get(id);
  if (!set) return;
  const data = `event: ${event}\n` + `data: ${JSON.stringify(payload)}\n\n`;
  for (const cb of Array.from(set)) cb(data);
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const push = (s: string) => controller.enqueue(encoder.encode(s));
      const unsub = subscribe(id, (s) => push(s));
      const ping = setInterval(() => {
        try { push(`:ping\n\n`); } catch {}
      }, 15000);
      controller.enqueue(encoder.encode(`:connected\n\n`));
      controller.enqueue(encoder.encode(`retry: 5000\n\n`));
      controller.enqueue(encoder.encode(`event: ready\n` + `data: ${JSON.stringify({ ok: true })}\n\n`));
      controller.close = controller.close.bind(controller);
      (controller as any)._cleanup = () => { clearInterval(ping); unsub(); };
    },
    cancel() {
      try { (this as any)._cleanup?.(); } catch {}
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

