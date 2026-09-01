import { NotificationType, Prisma } from "@prisma/client";

import { CATEGORY_FOR_TYPE } from "./notification-categories";

/*
 * Fan-out helpers: called inside the same transaction as the write
 * that triggered the notification (training changes, new videos,
 * new evaluations, new feedback, announcements) — see ARCHITECTURE.md
 * §2.2. Fire-and-forget in the sense that a notification failure
 * should never fail the underlying write, but running it in the same
 * tx keeps the two consistent (either both commit or neither does).
 */

interface NotifyInput {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  linkPath?: string;
  /** A repeat notification with the same key replaces any earlier *unread* one
   *  for that user, so edits don't stack. */
  dedupeKey?: string;
}

export async function notifyUser(
  tx: Prisma.TransactionClient,
  { userId, type, title, message, linkPath, dedupeKey }: NotifyInput,
) {
  if (dedupeKey) {
    await tx.notification.deleteMany({ where: { userId, dedupeKey, isRead: false } });
  }
  await tx.notification.create({
    data: { userId, type, category: CATEGORY_FOR_TYPE[type], title, message, linkPath, dedupeKey },
  });
}

export async function notifyUsers(
  tx: Prisma.TransactionClient,
  userIds: number[],
  data: Omit<NotifyInput, "userId">,
) {
  if (userIds.length === 0) return;

  if (data.dedupeKey) {
    await tx.notification.deleteMany({
      where: { userId: { in: userIds }, dedupeKey: data.dedupeKey, isRead: false },
    });
  }

  await tx.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type: data.type,
      category: CATEGORY_FOR_TYPE[data.type],
      title: data.title,
      message: data.message,
      linkPath: data.linkPath,
      dedupeKey: data.dedupeKey,
    })),
  });
}

/** Every player currently on a team's roster (any active season), as user ids —
 *  for team-wide fan-out (new session, new team video, announcement). */
export async function teamPlayerUserIds(
  tx: Prisma.TransactionClient,
  teamId: number,
): Promise<number[]> {
  const memberships = await tx.teamMembership.findMany({
    where: { teamId, status: { notIn: ["FORMER", "INACTIVE"] } },
    select: { player: { select: { userId: true } } },
  });
  return [...new Set(memberships.map((m) => m.player.userId))];
}
