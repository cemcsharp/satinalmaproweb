// Notification service - restored
import { prisma } from "@/lib/db";

export type NotificationType = "info" | "success" | "warning" | "error";

export async function notify({
  userId,
  title,
  body,
  type = "info",
  link,
}: {
  userId: string;
  title: string;
  body: string;
  type?: NotificationType;
  link?: string;
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type,
        meta: link ? { link } : undefined,
        read: false,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

export async function listNotifications(userId: string, limit = 50) {
  try {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (error) {
    console.error("Failed to list notifications:", error);
    return [];
  }
}

export async function markAsRead(notificationId: string) {
  try {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return null;
  }
}

// ========================================
// Real-time SSE Subscription
// ========================================

type Listener = (data: any) => void;
const listeners: Set<Listener> = new Set();

/**
 * Subscribe to notification events (for SSE streaming)
 * @returns Unsubscribe function
 */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Publish notification to all subscribers
 */
export function publish(data: any): void {
  listeners.forEach((listener) => {
    try {
      listener(data);
    } catch (error) {
      console.error("Error in notification listener:", error);
    }
  });
}

/**
 * Notify user and publish to SSE stream
 */
export async function notifyAndPublish({
  userId,
  title,
  body,
  type = "info",
  link,
}: {
  userId: string;
  title: string;
  body: string;
  type?: NotificationType;
  link?: string;
}) {
  const notification = await notify({ userId, title, body, type, link });
  if (notification) {
    publish(notification);
  }
  return notification;
}

