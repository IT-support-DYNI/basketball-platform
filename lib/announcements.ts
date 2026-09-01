import type { Prisma } from "@prisma/client";
import type { Session } from "next-auth";

import { prisma } from "./prisma";
import { teamPlayerUserIds } from "./notify";

/**
 * Announcements are a broadcast surface (brief §12) — distinct from chat and
 * from per-user notifications. A team announcement reaches the team's players,
 * their guardians and the team's staff; a PLATFORM one reaches everyone in
 * those roles. When `requiresAck` is set the author gets a who-hasn't-read-it
 * list.
 */

/** The team ids relevant to this caller (staff assignments / own team /
 *  a guardian's children's teams). */
async function callerTeamIds(session: Session): Promise<number[]> {
  if (session.user.role === "COACH") return session.user.teamIds ?? [];
  if (session.user.role === "PLAYER") return session.user.teamId != null ? [session.user.teamId] : [];
  if (session.user.role === "GUARDIAN") {
    const links = await prisma.guardianRelationship.findMany({
      where: { guardianUserId: Number(session.user.id) },
      select: {
        player: {
          select: {
            memberships: {
              where: { status: { notIn: ["FORMER", "INACTIVE"] } },
              select: { teamId: true },
            },
            registrationTeamId: true,
          },
        },
      },
    });
    const ids = new Set<number>();
    for (const l of links) {
      for (const m of l.player.memberships) ids.add(m.teamId);
      if (l.player.registrationTeamId) ids.add(l.player.registrationTeamId);
    }
    return [...ids];
  }
  return [];
}

function scopeFilter(session: Session, teamIds: number[]): Prisma.AnnouncementWhereInput {
  if (session.user.role === "ADMIN") return {};
  return { OR: [{ scope: "PLATFORM" }, { teamId: { in: teamIds.length ? teamIds : [-1] } }] };
}

export type AnnouncementView = {
  id: number;
  title: string;
  body: string;
  scope: string;
  team: { id: number; name: string } | null;
  author: { name: string };
  requiresAck: boolean;
  pinned: boolean;
  createdAt: string;
  acknowledgedByMe: boolean;
  ackCount: number;
  /** May the caller open the who-hasn't-read-it breakdown? */
  canViewAcks: boolean;
};

/** Everything the caller can see, pinned first then newest, with their ack state. */
export async function announcementsFor(session: Session): Promise<AnnouncementView[]> {
  const teamIds = await callerTeamIds(session);
  const userId = Number(session.user.id);
  const now = new Date();

  const rows = await prisma.announcement.findMany({
    where: scopeFilter(session, teamIds),
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      author: { select: { name: true } },
      team: { select: { id: true, name: true } },
      acks: { where: { userId }, select: { id: true } },
      _count: { select: { acks: true } },
    },
  });

  const isAdmin = session.user.role === "ADMIN";
  const staffTeamIds = new Set(session.user.role === "COACH" ? session.user.teamIds ?? [] : []);

  return rows
    .map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      scope: a.scope,
      team: a.team,
      author: a.author,
      requiresAck: a.requiresAck,
      pinned: a.pinnedUntil != null && a.pinnedUntil > now,
      createdAt: a.createdAt.toISOString(),
      acknowledgedByMe: a.acks.length > 0,
      ackCount: a._count.acks,
      canViewAcks:
        a.requiresAck &&
        (isAdmin || a.authorUserId === userId || (a.teamId != null && staffTeamIds.has(a.teamId))),
    }))
    .sort((x, y) => Number(y.pinned) - Number(x.pinned) || y.createdAt.localeCompare(x.createdAt));
}

/** Count of `requiresAck` announcements the caller can see but hasn't acked. */
export async function outstandingAckCount(session: Session): Promise<number> {
  const teamIds = await callerTeamIds(session);
  const userId = Number(session.user.id);
  return prisma.announcement.count({
    where: {
      AND: [scopeFilter(session, teamIds), { requiresAck: true }, { acks: { none: { userId } } }],
    },
  });
}

/** Users a new announcement should notify + who is "expected" to acknowledge. */
export async function announcementAudience(
  tx: Prisma.TransactionClient,
  a: { scope: string; teamId: number | null },
): Promise<number[]> {
  if (a.scope === "TEAM" && a.teamId != null) {
    const players = await teamPlayerUserIds(tx, a.teamId);
    const guardians = await tx.guardianRelationship.findMany({
      where: { player: { memberships: { some: { teamId: a.teamId, status: { notIn: ["FORMER", "INACTIVE"] } } } } },
      select: { guardianUserId: true },
    });
    const staff = await tx.staffAssignment.findMany({ where: { teamId: a.teamId }, select: { userId: true } });
    return [...new Set([...players, ...guardians.map((g) => g.guardianUserId), ...staff.map((s) => s.userId)])];
  }
  const users = await tx.user.findMany({
    where: { role: { in: ["PLAYER", "GUARDIAN", "COACH"] }, isActive: true },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

/** For the author: who has / hasn't acknowledged. */
export async function ackBreakdown(announcementId: number) {
  const a = await prisma.announcement.findUnique({
    where: { id: announcementId },
    select: { scope: true, teamId: true },
  });
  if (!a) return null;

  const expectedIds = await announcementAudience(prisma, a);
  const [acks, users] = await Promise.all([
    prisma.announcementAck.findMany({
      where: { announcementId },
      select: { userId: true, acknowledgedAt: true },
    }),
    prisma.user.findMany({ where: { id: { in: expectedIds } }, select: { id: true, name: true, role: true } }),
  ]);
  const ackedAt = new Map(acks.map((k) => [k.userId, k.acknowledgedAt]));

  const people = users
    .map((u) => ({ name: u.name, role: u.role, acknowledgedAt: ackedAt.get(u.id) ?? null }))
    .sort((x, y) => Number(!!y.acknowledgedAt) - Number(!!x.acknowledgedAt) || x.name.localeCompare(y.name));

  return {
    expected: people.length,
    acknowledged: people.filter((p) => p.acknowledgedAt).length,
    people,
  };
}
