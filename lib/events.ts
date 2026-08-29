import type { Session } from "next-auth";
import type { EventType, Prisma } from "@prisma/client";

/**
 * Event helpers shared by the calendar API and the schedule pages. Recurrence
 * expansion lands in W5 part 2; part 1 is the flat model + range queries.
 */

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  TRAINING: "Training",
  MATCH: "Match",
  TOURNAMENT: "Tournament",
  TEAM_MEETING: "Team meeting",
  FITNESS_TEST: "Fitness test",
  SOCIAL: "Social",
  MEDICAL: "Medical",
  REGISTRATION_DEADLINE: "Registration deadline",
  PAYMENT_DEADLINE: "Payment deadline",
  OTHER: "Event",
};

/** A single point in time counts as a deadline-style event (start === end). */
export function isDeadline(e: { startAt: Date; endAt: Date }): boolean {
  return e.startAt.getTime() === e.endAt.getTime();
}

/** "Fri 29 Aug" */
export function eventDayLabel(d: Date | string): string {
  return new Date(d).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** "18:00 – 19:30" */
export function eventTimeRange(start: Date | string, end: Date | string): string {
  const fmt = (d: Date | string) =>
    new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${fmt(start)} – ${fmt(end)}`;
}

/**
 * Prisma `where` fragment: events this caller may see.
 *   - ADMIN: everything
 *   - COACH: their teams' events + club-wide events
 *   - PLAYER: their team's events + club-wide events
 * `visibility` is not yet enforced here (all roles above are club members);
 * PUBLIC-site scoping is a later concern.
 */
export function visibleEventScope(session: Session): Prisma.EventWhereInput {
  if (session.user.role === "ADMIN") return {};
  const teamIds =
    session.user.teamIds && session.user.teamIds.length > 0
      ? session.user.teamIds
      : session.user.teamId != null
        ? [session.user.teamId]
        : [];
  return { OR: [{ teamId: null }, { teamId: { in: teamIds } }] };
}

/** Parse `?from=` / `?to=` ISO params into a `startAt` range filter. Defaults
 *  to a window around now when neither is given. */
export function parseRange(searchParams: URLSearchParams): { gte: Date; lte: Date } {
  const now = Date.now();
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const gte = from ? new Date(from) : new Date(now - 30 * 864e5);
  const lte = to ? new Date(to) : new Date(now + 120 * 864e5);
  return { gte, lte };
}
