import { randomBytes } from "crypto";
import type { Session } from "next-auth";

import { prisma } from "./prisma";
import { visibleEventScope } from "./events";
import type { IcsEvent } from "./ics";

const icsSelect = {
  id: true,
  type: true,
  title: true,
  description: true,
  startAt: true,
  endAt: true,
  status: true,
  locationText: true,
  updatedAt: true,
  venue: { select: { name: true, address: true } },
} as const;

/** The caller's personal ICS subscription token, minted on first request. */
export async function getOrCreateCalendarToken(userId: number): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { calendarToken: true } });
  if (user?.calendarToken) return user.calendarToken;
  const token = randomBytes(24).toString("base64url");
  await prisma.user.update({ where: { id: userId }, data: { calendarToken: token } });
  return token;
}

/** Invalidate the old subscription URL and issue a new token. */
export async function rotateCalendarToken(userId: number): Promise<string> {
  const token = randomBytes(24).toString("base64url");
  await prisma.user.update({ where: { id: userId }, data: { calendarToken: token } });
  return token;
}

/** Resolve a feed token to the events that user is allowed to see (a window
 *  around now), or null if the token is unknown. */
export async function eventsForFeedToken(token: string): Promise<{ name: string; events: IcsEvent[] } | null> {
  const user = await prisma.user.findUnique({
    where: { calendarToken: token },
    select: { id: true, name: true, role: true, coachProfile: { select: { id: true } }, playerProfile: { select: { id: true } } },
  });
  if (!user) return null;

  // Build the minimal session shape visibleEventScope needs.
  const [staff, membership] = await Promise.all([
    prisma.staffAssignment.findMany({ where: { userId: user.id }, select: { teamId: true } }),
    user.playerProfile
      ? prisma.teamMembership.findFirst({
          where: { playerProfileId: user.playerProfile.id, status: { notIn: ["FORMER", "INACTIVE"] } },
          select: { teamId: true },
        })
      : null,
  ]);
  const teamIds = [...new Set(staff.map((s) => s.teamId))];
  const session = {
    user: {
      role: user.role,
      teamIds: teamIds.length ? teamIds : undefined,
      teamId: membership?.teamId,
    },
  } as unknown as Session;

  const now = Date.now();
  const events = await prisma.event.findMany({
    where: {
      AND: [visibleEventScope(session), { startAt: { gte: new Date(now - 30 * 864e5), lte: new Date(now + 180 * 864e5) } }],
    },
    orderBy: { startAt: "asc" },
    select: icsSelect,
  });

  return { name: `DYNI Blazers — ${user.name}`, events };
}
