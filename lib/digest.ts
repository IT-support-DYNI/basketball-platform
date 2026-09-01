import { prisma } from "./prisma";
import { sendMail } from "./mail";
import { baseUrl } from "./base-url";
import { CATEGORY_DEFAULTS, CATEGORY_LABEL, NOTIFICATION_CATEGORIES } from "./notification-categories";

/**
 * Daily unread-notification digest. Runs from the cron. For each user with
 * unread notifications in a category they've opted into email for, send one
 * summary — never one email per event (Doc 10). Because the cron is daily and
 * we only count *unread* items, a user gets at most one digest per day and it
 * stops once they've read everything.
 */
export async function runNotificationDigest(now: Date = new Date()) {
  // Categories anyone has turned email on for (default is off).
  const emailPrefs = await prisma.notificationPreference.findMany({
    where: { email: true },
    select: { userId: true, category: true },
  });
  const wantEmail = new Map<number, Set<string>>();
  for (const p of emailPrefs) {
    (wantEmail.get(p.userId) ?? wantEmail.set(p.userId, new Set()).get(p.userId)!).add(p.category);
  }
  // Categories whose *default* is email-on (none today, but keep it honest).
  const defaultEmailCats = NOTIFICATION_CATEGORIES.filter((c) => CATEGORY_DEFAULTS[c].email);

  const candidateUserIds = new Set<number>(wantEmail.keys());
  if (defaultEmailCats.length > 0) {
    const all = await prisma.user.findMany({ where: { isActive: true }, select: { id: true } });
    for (const u of all) candidateUserIds.add(u.id);
  }
  if (candidateUserIds.size === 0) return { sent: 0 };

  // The digest is a daily job. Only fire for a user when something became
  // stale-but-unread *since yesterday's run* — an item aged 20–44h — so a
  // repeat manual trigger the same day doesn't re-send, and read items drop out.
  const staleFrom = new Date(now.getTime() - 44 * 3600e3);
  const staleTo = new Date(now.getTime() - 20 * 3600e3);
  let sent = 0;

  for (const userId of candidateUserIds) {
    const cats = new Set([...(wantEmail.get(userId) ?? []), ...defaultEmailCats]);
    if (cats.size === 0) continue;

    const unread = await prisma.notification.findMany({
      where: { userId, isRead: false, category: { in: [...cats] as never[] }, createdAt: { lte: now } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    if (!unread.some((n) => n.createdAt >= staleFrom && n.createdAt <= staleTo)) continue;

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    if (!user || user.email.endsWith("@guardian.local")) continue;

    const byCat = new Map<string, number>();
    for (const n of unread) byCat.set(n.category, (byCat.get(n.category) ?? 0) + 1);
    const lines = [...byCat.entries()].map(
      ([c, n]) => `• ${n} ${CATEGORY_LABEL[c as keyof typeof CATEGORY_LABEL]}`,
    );

    await sendMail({
      to: user.email,
      subject: `You have ${unread.length} unread notification${unread.length === 1 ? "" : "s"} — DYNI Blazers`,
      text: [
        `Hi ${user.name},`,
        "",
        "Here's what's waiting for you on the DYNI Blazers platform:",
        "",
        ...lines,
        "",
        `Open your notifications: ${baseUrl()}/notifications`,
        "",
        "Change what you're emailed about from the same page.",
      ].join("\n"),
    });
    sent += 1;
  }

  return { sent };
}
