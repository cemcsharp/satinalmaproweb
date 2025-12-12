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
