import type { NotificationCategory } from "@prisma/client";

import { prisma } from "./prisma";
import { CATEGORY_DEFAULTS, NOTIFICATION_CATEGORIES } from "./notification-categories";

export {
  CATEGORY_FOR_TYPE,
  CATEGORY_LABEL,
  NOTIFICATION_CATEGORIES,
  CATEGORY_DEFAULTS,
} from "./notification-categories";

/**
 * Per-user notification channel preferences. In-app is always on; only push and
 * email are opt-in/out. Push defaults on (it's free); email defaults off (no
 * provider on the free tier — the console adapter just logs it).
 */

export type ChannelPrefs = { email: boolean; push: boolean };

/** Effective preferences across every category (row or category default). */
export async function preferencesFor(userId: number): Promise<Record<NotificationCategory, ChannelPrefs>> {
  const rows = await prisma.notificationPreference.findMany({ where: { userId } });
  const byCat = new Map(rows.map((r) => [r.category, { email: r.email, push: r.push }]));
  const out = {} as Record<NotificationCategory, ChannelPrefs>;
  for (const cat of NOTIFICATION_CATEGORIES) out[cat] = byCat.get(cat) ?? CATEGORY_DEFAULTS[cat];
  return out;
}

/** The userIds (from `candidates`) who want `channel` for `category`. */
export async function optedIn(
  candidates: number[],
  category: NotificationCategory,
  channel: "push" | "email",
): Promise<number[]> {
  if (candidates.length === 0) return [];
  const rows = await prisma.notificationPreference.findMany({
    where: { userId: { in: candidates }, category },
    select: { userId: true, email: true, push: true },
  });
  const explicit = new Map(rows.map((r) => [r.userId, channel === "push" ? r.push : r.email]));
  const dflt = CATEGORY_DEFAULTS[category][channel];
  return candidates.filter((id) => explicit.get(id) ?? dflt);
}

export async function setPreference(
  userId: number,
  category: NotificationCategory,
  patch: Partial<ChannelPrefs>,
) {
  const current = (await preferencesFor(userId))[category];
  return prisma.notificationPreference.upsert({
    where: { userId_category: { userId, category } },
    create: { userId, category, email: patch.email ?? current.email, push: patch.push ?? current.push },
    update: patch,
  });
}
