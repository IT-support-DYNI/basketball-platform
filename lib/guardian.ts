import { prisma } from "./prisma";
import { outstandingConsents } from "./consent";
import { visibleEventScope } from "./events";
import type { Session } from "next-auth";

export type ChildSummary = {
  playerProfileId: number;
  userId: number;
  name: string;
  relationshipLabel: string;
  registrationStatus: string;
  registrationReviewNote: string | null;
  outstandingConsents: number;
  team: { id: number; name: string } | null;
  nextEvent: { id: number; title: string; startAt: Date } | null;
};

/** Everything a guardian's dashboard needs about their linked children. */
export async function childrenOf(guardianUserId: number): Promise<ChildSummary[]> {
  const links = await prisma.guardianRelationship.findMany({
    where: { guardianUserId },
    orderBy: { createdAt: "asc" },
    include: {
      player: {
        include: {
          user: { select: { id: true, name: true } },
          memberships: {
            where: { status: { notIn: ["FORMER", "INACTIVE"] } },
            orderBy: { joinedAt: "desc" },
            take: 1,
            include: { team: { select: { id: true, name: true } } },
          },
          registrationTeam: { select: { id: true, name: true } },
        },
      },
    },
  });

  return Promise.all(
    links.map(async (link) => {
      const p = link.player;
      const teamId = p.memberships[0]?.teamId ?? p.registrationTeamId ?? undefined;
      const team = p.memberships[0]?.team ?? p.registrationTeam ?? null;

      const [outstanding, nextEvent] = await Promise.all([
        outstandingConsents(p.id),
        teamId
          ? prisma.event.findFirst({
              where: {
                AND: [
                  visibleEventScope({ user: { role: "PLAYER", teamId } } as unknown as Session),
                  { startAt: { gte: new Date() }, status: { not: "CANCELLED" } },
                ],
              },
              orderBy: { startAt: "asc" },
              select: { id: true, title: true, startAt: true },
            })
          : null,
      ]);

      return {
        playerProfileId: p.id,
        userId: p.user.id,
        name: p.user.name,
        relationshipLabel: link.relationshipLabel,
        registrationStatus: p.registrationStatus,
        registrationReviewNote: p.registrationReviewNote,
        outstandingConsents: outstanding.length,
        team,
        nextEvent,
      };
    }),
  );
}
