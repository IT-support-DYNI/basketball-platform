import webpush from "web-push";

import { prisma } from "./prisma";

/*
 * Web Push (ARCHITECTURE.md §8 pulled forward). Fires *after* the DB
 * transaction that created the in-app Notification row has committed —
 * never inside it, since sending is a network call and a failed/slow
 * push must never roll back or block the actual notification write.
 * A subscription that the browser has revoked (410/404 from the push
 * service) is deleted so we stop retrying it forever.
 */

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushToUsers(userIds: number[], payload: PushPayload): Promise<void> {
  if (userIds.length === 0 || !ensureConfigured()) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error("Push send failed:", error);
        }
      }
    })
  );
}

export function sendPushToUser(userId: number, payload: PushPayload): Promise<void> {
  return sendPushToUsers([userId], payload);
}
