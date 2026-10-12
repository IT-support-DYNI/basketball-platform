import type { Prisma, PlayType } from "@prisma/client";
import type { Session } from "next-auth";

import { prisma } from "./prisma";
import { authorize } from "./authz/guard";
import { notifyUsers, teamPlayerUserIds } from "./notify";
import { sendPushToUsers } from "./push";
import { NotFoundError } from "./api/errors";
import { teamClubScope } from "./tenant";
import { planAssignmentChange } from "./playbook";

/**
 * The playbook. A Play lives in the club's shared library (coaches read all of
 * it, like drills); a PlayAssignment puts it in one team's playbook. Players
 * and guardians only ever reach a play through an assignment to a team they
 * belong to, so every read for them goes through `playbookTeamIds`.
 */

const assignmentSelect = {
  teamId: true,
  team: { select: { id: true, name: true } },
} satisfies Prisma.PlayAssignmentSelect;

/** Library fields for coaches: never whole User rows. */
const librarySelect = {
  id: true,
  clubId: true,
  name: true,
  type: true,
  notes: true,
  courtDiagram: true,
  archivedAt: true,
  createdByUserId: true,
  updatedAt: true,
  createdBy: { select: { name: true } },
  assignments: { select: assignmentSelect, orderBy: { team: { name: "asc" } } },
} satisfies Prisma.PlaySelect;

export type LibraryPlay = Prisma.PlayGetPayload<{ select: typeof librarySelect }>;

export function isStaff(session: Session): boolean {
  return session.user.role === "COACH" || session.user.role === "ADMIN";
}

/* -------------------------------------------------------------------------- */
/*  Coach / admin: the library                                                  */
/* -------------------------------------------------------------------------- */

export async function listPlayLibrary(
  clubId: number,
  filters: { type?: PlayType | null; q?: string | null; includeArchived?: boolean } = {},
) {
  return prisma.play.findMany({
    where: {
      clubId,
      ...(filters.includeArchived ? {} : { archivedAt: null }),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.q ? { name: { contains: filters.q, mode: "insensitive" as const } } : {}),
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
    select: librarySelect,
  });
}

export async function libraryPlay(clubId: number, id: number): Promise<LibraryPlay | null> {
  if (!Number.isInteger(id)) return null;
  const play = await prisma.play.findUnique({ where: { id }, select: librarySelect });
  if (!play || play.clubId !== clubId) return null;
  return play;
}

/** The teams this staff member may put a play on (admin: every active team in the club). */
export async function assignableTeams(session: Session, clubId: number) {
  const teams = await prisma.team.findMany({
    where: { AND: [teamClubScope({ clubId }), { status: "ACTIVE" }] },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const a = authorize(session);
  return teams.filter((t) => a.can("access", "Team", { id: t.id }));
}

/* -------------------------------------------------------------------------- */
/*  Player / guardian: the playbook                                             */
/* -------------------------------------------------------------------------- */

/** The teams whose playbook this person may read: a player's current team, or
 *  every team a guardian's linked children are currently on. */
export async function playbookTeamIds(session: Session): Promise<number[]> {
  if (session.user.role === "PLAYER") {
    return session.user.teamId != null ? [session.user.teamId] : [];
  }
  if (session.user.role === "GUARDIAN") {
    const memberships = await prisma.teamMembership.findMany({
      where: {
        status: { notIn: ["FORMER", "INACTIVE"] },
        player: { guardians: { some: { guardianUserId: Number(session.user.id) } } },
      },
      select: { teamId: true },
    });
    return [...new Set(memberships.map((m) => m.teamId))];
  }
  return [];
}

const playbookSelect = (teamIds: number[]) =>
  ({
    id: true,
    name: true,
    type: true,
    notes: true,
    courtDiagram: true,
    updatedAt: true,
    // Only the reader's own teams: a player never learns which other teams have the play.
    assignments: { where: { teamId: { in: teamIds } }, select: assignmentSelect },
  }) satisfies Prisma.PlaySelect;

const inPlaybook = (teamIds: number[]): Prisma.PlayWhereInput => ({
  archivedAt: null,
  assignments: { some: { teamId: { in: teamIds } } },
});

export async function listPlaybook(teamIds: number[]) {
  if (teamIds.length === 0) return [];
  return prisma.play.findMany({
    where: inPlaybook(teamIds),
    orderBy: [{ type: "asc" }, { name: "asc" }],
    select: playbookSelect(teamIds),
  });
}

export async function playbookPlay(teamIds: number[], id: number) {
  if (teamIds.length === 0 || !Number.isInteger(id)) return null;
  return prisma.play.findFirst({ where: { id, ...inPlaybook(teamIds) }, select: playbookSelect(teamIds) });
}

/* -------------------------------------------------------------------------- */
/*  Assigning                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Make `requested` the set of teams (among those this person may manage) that
 * have the play. Assignments on teams they don't manage, made by another coach
 * or an admin, are left alone. Players and guardians on newly added teams are
 * notified; removing a play is silent.
 */
export async function setPlayAssignments(
  session: Session,
  clubId: number,
  play: { id: number; name: string; archivedAt: Date | null },
  requested: number[],
) {
  const manageable = (await assignableTeams(session, clubId)).map((t) => t.id);
  const current = await prisma.playAssignment.findMany({ where: { playId: play.id }, select: { teamId: true } });
  const { toAdd, toRemove } = planAssignmentChange({
    current: current.map((a) => a.teamId),
    requested,
    manageable,
    archived: play.archivedAt != null,
  });

  const recipients = await prisma.$transaction(async (tx) => {
    if (toRemove.length) {
      await tx.playAssignment.deleteMany({ where: { playId: play.id, teamId: { in: toRemove } } });
    }
    if (toAdd.length === 0) return { players: [] as number[], guardians: [] as number[] };

    await tx.playAssignment.createMany({
      data: toAdd.map((teamId) => ({ playId: play.id, teamId, assignedByUserId: Number(session.user.id) })),
      skipDuplicates: true,
    });

    const players = [...new Set((await Promise.all(toAdd.map((t) => teamPlayerUserIds(tx, t)))).flat())];
    const guardianLinks = await tx.guardianRelationship.findMany({
      where: { player: { userId: { in: players } } },
      select: { guardianUserId: true },
    });
    const guardians = [...new Set(guardianLinks.map((g) => g.guardianUserId))].filter((g) => !players.includes(g));

    const title = `New play: ${play.name}`;
    await notifyUsers(tx, players, {
      type: "NEW_PLAY",
      title,
      message: "Your coach added a play to the team playbook.",
      linkPath: `/player/playbook/${play.id}`,
      dedupeKey: `play:${play.id}`,
    });
    await notifyUsers(tx, guardians, {
      type: "NEW_PLAY",
      title,
      message: "A play was added to your child's team playbook.",
      linkPath: `/guardian/playbook/${play.id}`,
      dedupeKey: `play:${play.id}`,
    });
    return { players, guardians };
  });

  await Promise.all([
    sendPushToUsers(
      recipients.players,
      { title: `New play: ${play.name}`, body: "Added to your team playbook.", url: `/player/playbook/${play.id}` },
      "PLAYBOOK",
    ),
    sendPushToUsers(
      recipients.guardians,
      { title: `New play: ${play.name}`, body: "Added to your child's team playbook.", url: `/guardian/playbook/${play.id}` },
      "PLAYBOOK",
    ),
  ]);

  return { added: toAdd, removed: toRemove };
}

export function playNotFound(): never {
  throw new NotFoundError("That play wasn't found.");
}
