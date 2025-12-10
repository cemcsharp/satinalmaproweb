import { prisma } from "@/lib/db";
import { renderEmailTemplate, dispatchEmail } from "@/lib/mailer";

type NotifyInput = { userId: string; title: string; body: string; type?: string; meta?: any };

const subscribers = new Set<(payload: any) => void>();
const emailQueue: NotifyInput[] = [];
let processing = false;

export function subscribe(fn: (payload: any) => void) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

function broadcast(payload: any) {
  for (const fn of subscribers) {
    try { fn(payload); } catch {}
  }
}

async function processQueue() {
  if (processing) return;
  processing = true;
  try {
    while (emailQueue.length) {
      const item = emailQueue.shift()!;
      try {
        const user = await prisma.user.findUnique({ where: { id: item.userId } });
        const prefs = await prisma.notificationPreference.findUnique({ where: { userId: item.userId } }).catch(() => null);
        const emailEnabled = Boolean(prefs?.emailEnabled ?? true);
        if (emailEnabled && user?.email) {
          const html = renderEmailTemplate("generic", { title: item.title, body: item.body });
          await dispatchEmail({ to: user.email, subject: item.title, html, category: "notification" });
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 50));
    }
  } finally {
    processing = false;
  }
}

export async function notify(input: NotifyInput) {
  const created = await prisma.notification.create({ data: {
    userId: input.userId,
    title: input.title,
    body: input.body,
    type: input.type || "info",
    meta: input.meta ?? null,
  }});
  broadcast({ id: created.id, userId: created.userId, title: created.title, body: created.body, type: created.type, createdAt: created.createdAt });
  emailQueue.push(input);
  processQueue();
  return created;
}

export async function markRead(userId: string, id: string) {
  await prisma.notification.update({ where: { id }, data: { read: true } });
}

export async function listNotifications(userId: string, limit = 20) {
  const items = await prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: limit });
  return items;
}
