import type { Session } from "next-auth";

import { prisma } from "./prisma";
import { outstandingAckCount } from "./announcements";
import { conversationsFor } from "./chat";

/**
 * The "needs your attention" band shown at the top of every dashboard. One
 * shared resolver so the player, coach and admin dashboards agree on what
 * counts as outstanding and where each item links.
 */

export type ActionItem = {
  key: string;
  /** Short count-led label, e.g. "3 messages" — the card prefixes "Unread" etc. */
  label: string;
  detail: string;
  href: string;
  count: number;
  tone: "flame" | "warning" | "info";
};

export async function actionItemsFor(session: Session): Promise<ActionItem[]> {
  const role = session.user.role;
  const userId = Number(session.user.id);
  const items: ActionItem[] = [];

  const [unreadMessages, acksOutstanding] = await Promise.all([
    conversationsFor(userId).then((cs) => cs.reduce((n, c) => n + c.unread, 0)),
    outstandingAckCount(session),
  ]);

  if (acksOutstanding > 0) {
    items.push({
      key: "announcements",
      label: `${acksOutstanding} to read`,
      detail: "Announcement" + (acksOutstanding === 1 ? "" : "s") + " waiting for your acknowledgement",
      href: "/announcements",
      count: acksOutstanding,
      tone: "warning",
    });
  }

  if (unreadMessages > 0) {
    items.push({
      key: "messages",
      label: `${unreadMessages} unread`,
      detail: `Unread message${unreadMessages === 1 ? "" : "s"} across your conversations`,
      href: "/messages",
      count: unreadMessages,
      tone: "info",
    });
  }

  if (role === "PLAYER" && session.user.teamId != null) {
    const now = new Date();
    const horizon = new Date(now.getTime() + 14 * 24 * 3600e3);
    const pendingRsvp = await prisma.event.count({
      where: {
        status: "SCHEDULED",
        startAt: { gte: now },
        rsvpDeadline: { gte: now, lte: horizon },
        OR: [{ teamId: session.user.teamId }, { teamId: null }],
        availabilityResponses: { none: { userId } },
      },
    });
    if (pendingRsvp > 0) {
      items.push({
        key: "rsvp",
        label: `${pendingRsvp} to answer`,
        detail: `Upcoming event${pendingRsvp === 1 ? "" : "s"} you haven't RSVP'd to`,
        href: "/player/training",
        count: pendingRsvp,
        tone: "flame",
      });
    }
  }

  if (role === "ADMIN") {
    const pendingRegistrations = await prisma.playerProfile.count({
      where: { registrationStatus: "PENDING" },
    });
    if (pendingRegistrations > 0) {
      items.push({
        key: "registrations",
        label: `${pendingRegistrations} pending`,
        detail: `Registration${pendingRegistrations === 1 ? "" : "s"} awaiting review`,
        href: "/admin/registrations",
        count: pendingRegistrations,
        tone: "flame",
      });
    }
  }

  return items;
}
