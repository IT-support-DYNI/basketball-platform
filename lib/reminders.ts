import { prisma } from "./prisma";
import { notifyUsers, teamPlayerUserIds } from "./notify";
import { sendPushToUsers } from "./push";
import { eventDayLabel } from "./events";

/**
 * RSVP nudges. Run daily by the cron route. An event is "due a nudge" when it's
 * scheduled, team-scoped, not yet nudged, and either:
 *   - its RSVP deadline falls in the next 24h, or
 *   - it has no deadline and starts in 24–48h.
 * Players on the roster with no AvailabilityResponse yet get one notification;
 * `Event.rsvpReminderSentAt` guarantees at most once per event.
 */
export async function runRsvpReminders(now: Date = new Date()) {
  const in24h = new Date(now.getTime() + 24 * 3600e3);
  const in48h = new Date(now.getTime() + 48 * 3600e3);

  const due = await prisma.event.findMany({
    where: {
      status: "SCHEDULED",
      teamId: { not: null },
      rsvpReminderSentAt: null,
      startAt: { gt: now },
      OR: [
        { rsvpDeadline: { gte: now, lte: in24h } },
        { AND: [{ rsvpDeadline: null }, { startAt: { gte: in24h, lte: in48h } }] },
      ],
    },
    select: { id: true, teamId: true, title: true, startAt: true, rsvpDeadline: true },
  });

  let notificationsSent = 0;

  for (const event of due) {
    const recipients = await prisma.$transaction(async (tx) => {
      const roster = await teamPlayerUserIds(tx, event.teamId!);
      const responded = await tx.availabilityResponse.findMany({
        where: { eventId: event.id, userId: { in: roster } },
        select: { userId: true },
      });
      const respondedSet = new Set(responded.map((r) => r.userId));
      const pending = roster.filter((id) => !respondedSet.has(id));

      if (pending.length > 0) {
        const when = event.rsvpDeadline
          ? `RSVP by ${eventDayLabel(event.rsvpDeadline)}`
          : `${eventDayLabel(event.startAt)} — let your coach know if you're coming`;
        await notifyUsers(tx, pending, {
          type: "TRAINING_CHANGE",
          title: `RSVP needed: ${event.title}`,
          message: `${event.title} — ${when}.`,
          linkPath: "/player/training",
        });
      }
      await tx.event.update({ where: { id: event.id }, data: { rsvpReminderSentAt: now } });
      return pending;
    });

    if (recipients.length > 0) {
      notificationsSent += recipients.length;
      await sendPushToUsers(recipients, {
        title: `RSVP needed: ${event.title}`,
        body: `${eventDayLabel(event.startAt)}`,
        url: "/player/training",
      });
    }
  }

  return { eventsProcessed: due.length, notificationsSent };
}
