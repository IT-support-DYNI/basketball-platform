import { NotificationType, Prisma } from "@prisma/client";

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
}

export async function notifyUser(
  tx: Prisma.TransactionClient,
  { userId, type, title, message, linkPath }: NotifyInput
) {
  await tx.notification.create({
    data: { userId, type, title, message, linkPath },
  });
}

export async function notifyUsers(
  tx: Prisma.TransactionClient,
  userIds: number[],
  data: Omit<NotifyInput, "userId">
) {
  if (userIds.length === 0) return;

  await tx.notification.createMany({
    data: userIds.map((userId) => ({ userId, ...data })),
  });
}

/** Every player currently on a team, as user ids — for team-wide fan-out (new session, new team video, announcement). */
export async function teamPlayerUserIds(
  tx: Prisma.TransactionClient,
  teamId: number
): Promise<number[]> {
  const players = await tx.playerProfile.findMany({
    where: { teamId },
    select: { userId: true },
  });
  return players.map((p) => p.userId);
}
