import { Prisma } from "@prisma/client";
import type { Session } from "next-auth";

import { prisma } from "./prisma";
import { authorize } from "./authz/guard";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "./api/errors";
import { getActiveSeason } from "./season";
import { getTenantContext } from "./tenant";

/**
 * Training session plans (brief §14). A plan belongs to a team + season; its
 * ordered blocks each optionally reference a library drill. `lib/drills.ts` owns
 * the drill side.
 */

const planInclude = {
  team: { select: { id: true, name: true } },
  createdBy: { select: { name: true } },
  event: { select: { id: true, title: true, startAt: true } },
  blocks: {
    orderBy: { order: "asc" as const },
    include: {
      drill: {
        select: {
          id: true,
          name: true,
          category: true,
          difficulty: true,
          durationMinutes: true,
          archivedAt: true,
          courtDiagram: true,
        },
      },
      play: {
        select: {
          id: true,
          name: true,
          type: true,
          courtDiagram: true,
          archivedAt: true,
          assignments: { select: { teamId: true } },
        },
      },
    },
  },
} satisfies import("@prisma/client").Prisma.TrainingPlanInclude;

type RawPlan = Prisma.TrainingPlanGetPayload<{ include: typeof planInclude }>;

/** Replace each linked play's assignment list with one flag: is it in this
 *  plan's team playbook? A plan's reader never learns which other teams have
 *  the play. */
function shapePlan(plan: RawPlan) {
  return {
    ...plan,
    blocks: plan.blocks.map(({ play, ...b }) => ({
      ...b,
      play: play
        ? {
            id: play.id,
            name: play.name,
            type: play.type,
            courtDiagram: play.courtDiagram,
            inTeamPlaybook: play.archivedAt == null && play.assignments.some((a) => a.teamId === plan.teamId),
          }
        : null,
    })),
  };
}
export type PlanWithBlocks = ReturnType<typeof shapePlan>;

export async function listPlans(
  teamIds: number[],
  opts: { status?: string | null; templates?: boolean } = {},
) {
  if (teamIds.length === 0) return [];
  return prisma.trainingPlan.findMany({
    where: {
      teamId: { in: teamIds },
      isTemplate: opts.templates ?? false,
      ...(opts.status ? { status: opts.status as "DRAFT" } : {}),
    },
    orderBy: [{ isTemplate: "asc" }, { date: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
    include: {
      team: { select: { id: true, name: true } },
      _count: { select: { blocks: true } },
      blocks: { select: { durationMinutes: true } },
    },
  });
}

/** Upcoming sessions a plan could be attached to: the team's future training /
 *  matches that don't already have a (different) plan. */
export async function linkableSessionsFor(teamId: number, currentPlanId?: number) {
  const rows = await prisma.event.findMany({
    where: {
      teamId,
      type: { in: ["TRAINING", "MATCH", "FITNESS_TEST", "TEAM_MEETING"] },
      status: { in: ["SCHEDULED", "COMPLETED"] },
      startAt: { gte: new Date(Date.now() - 7 * 24 * 3600e3) },
      OR: [{ trainingPlan: { is: null } }, ...(currentPlanId ? [{ trainingPlan: { id: currentPlanId } }] : [])],
    },
    orderBy: { startAt: "asc" },
    take: 40,
    select: { id: true, title: true, startAt: true, type: true },
  });
  return rows;
}

/** Validate an eventId a coach wants to attach: same team, not a deadline,
 *  not already taken by another plan. `null` = unlink; `undefined` = leave. */
async function resolveEventLink(
  eventId: number | null | undefined,
  teamId: number,
  planId: number | null,
): Promise<number | null | undefined> {
  if (eventId == null) return eventId;
  const ev = await prisma.event.findUnique({
    where: { id: eventId },
    select: { teamId: true, type: true, trainingPlan: { select: { id: true } } },
  });
  if (!ev || ev.teamId !== teamId) throw new BadRequestError("Pick a session that belongs to this team.");
  if (ev.type === "REGISTRATION_DEADLINE" || ev.type === "PAYMENT_DEADLINE") {
    throw new BadRequestError("That isn't a session you can plan.");
  }
  if (ev.trainingPlan && ev.trainingPlan.id !== planId) {
    throw new ConflictError("That session already has a plan.");
  }
  return eventId;
}

/** A plan the caller may see, with blocks + drills. Throws 404/403. */
export async function planForCaller(session: Session, id: number) {
  const plan = await prisma.trainingPlan.findUnique({ where: { id }, include: planInclude });
  if (!plan) throw new NotFoundError("That session plan wasn't found.");

  const scope = { teamId: plan.teamId, status: plan.status };
  if (authorize(session).cannot("read", "TrainingPlan", scope)) {
    throw new ForbiddenError("You don't have access to this session plan.");
  }
  return shapePlan(plan);
}

/** A block may only link a drill this club can see and a play from this
 *  club's library; anything else is a 400 rather than a foreign-key error. */
async function assertBlockLinks(clubId: number, blocks: BlockInput[]) {
  const drillIds = [...new Set(blocks.map((b) => b.drillId).filter((x): x is number => x != null))];
  const playIds = [...new Set(blocks.map((b) => b.playId).filter((x): x is number => x != null))];
  const [drills, plays] = await Promise.all([
    drillIds.length
      ? prisma.drill.count({ where: { id: { in: drillIds }, OR: [{ clubId }, { clubId: null }] } })
      : 0,
    playIds.length ? prisma.play.count({ where: { id: { in: playIds }, clubId } }) : 0,
  ]);
  if (drills !== drillIds.length) throw new BadRequestError("One of those drills wasn't found.");
  if (plays !== playIds.length) throw new BadRequestError("One of those plays wasn't found.");
}

export async function createPlan(
  session: Session,
  input: {
    teamId: number; title: string; objectives?: string; date?: string;
    isTemplate?: boolean; fromTemplateId?: number; eventId?: number;
  },
) {
  if (authorize(session).cannot("create", "TrainingPlan", { teamId: input.teamId })) {
    throw new ForbiddenError("You don't coach that team.");
  }
  const { clubId } = await getTenantContext(session);
  const season = await getActiveSeason(clubId);

  let date = input.date ?? null;
  const eventId = input.isTemplate ? undefined : await resolveEventLink(input.eventId, input.teamId, null);
  if (eventId) {
    const ev = await prisma.event.findUniqueOrThrow({ where: { id: eventId }, select: { startAt: true } });
    date ??= ev.startAt.toISOString();
  }

  let blockCreate: Prisma.TrainingBlockCreateWithoutTrainingPlanInput[] | undefined;
  let objectives = input.objectives;
  if (input.fromTemplateId) {
    const tpl = await prisma.trainingPlan.findUnique({
      where: { id: input.fromTemplateId },
      include: { blocks: { orderBy: { order: "asc" } } },
    });
    if (!tpl || tpl.teamId !== input.teamId || !tpl.isTemplate) {
      throw new NotFoundError("That template wasn't found.");
    }
    objectives ??= tpl.objectives ?? undefined;
    blockCreate = tpl.blocks.map((b, i) => ({
      category: b.category,
      order: i,
      title: b.title,
      durationMinutes: b.durationMinutes,
      notes: b.notes,
      // Keep each block's own diagram and its linked drill or play.
      courtDiagram: b.courtDiagram ?? Prisma.JsonNull,
      ...(b.drillId != null ? { drill: { connect: { id: b.drillId } } } : {}),
      ...(b.playId != null ? { play: { connect: { id: b.playId } } } : {}),
    }));
  }

  const created = await prisma.trainingPlan.create({
    data: {
      teamId: input.teamId,
      seasonId: season.id,
      title: input.title,
      objectives,
      date: date ? new Date(date) : null,
      eventId: eventId ?? null,
      isTemplate: input.isTemplate ?? false,
      templateOfId: input.fromTemplateId,
      createdByUserId: Number(session.user.id),
      ...(blockCreate ? { blocks: { create: blockCreate } } : {}),
    },
    include: planInclude,
  });
  return shapePlan(created);
}

type BlockInput = {
  category: string;
  title?: string;
  durationMinutes?: number;
  notes?: string;
  drillId?: number | null;
  playId?: number | null;
  courtDiagram?: Prisma.InputJsonValue | null;
};

export async function updatePlan(
  session: Session,
  id: number,
  patch: {
    title?: string;
    objectives?: string | null;
    date?: string | null;
    eventId?: number | null;
    status?: string;
    coachingNotes?: string | null;
    effectivenessRating?: number | null;
    postSessionNotes?: string | null;
    blocks?: BlockInput[];
  },
) {
  const plan = await prisma.trainingPlan.findUnique({ where: { id }, select: { teamId: true, isTemplate: true } });
  if (!plan) throw new NotFoundError("That session plan wasn't found.");
  if (authorize(session).cannot("update", "TrainingPlan", { teamId: plan.teamId })) {
    throw new ForbiddenError("You can't edit this session plan.");
  }

  if (patch.blocks) {
    const { clubId } = await getTenantContext(session);
    await assertBlockLinks(clubId, patch.blocks);
  }

  const eventId =
    patch.eventId === undefined || plan.isTemplate
      ? undefined
      : await resolveEventLink(patch.eventId, plan.teamId, id);

  const updated = await prisma.$transaction(async (tx) => {
    if (patch.blocks) {
      await tx.trainingBlock.deleteMany({ where: { trainingPlanId: id } });
      await tx.trainingBlock.createMany({
        data: patch.blocks.map((b, i) => ({
          trainingPlanId: id,
          category: b.category as "WARMUP",
          order: i,
          title: b.title ?? null,
          durationMinutes: b.durationMinutes ?? null,
          notes: b.notes ?? null,
          drillId: b.drillId ?? null,
          playId: b.playId ?? null,
          courtDiagram: b.courtDiagram ?? Prisma.JsonNull,
        })),
      });
    }
    return tx.trainingPlan.update({
      where: { id },
      data: {
        title: patch.title,
        objectives: patch.objectives === undefined ? undefined : patch.objectives,
        date:
          patch.date === undefined ? undefined : patch.date === null ? null : new Date(patch.date),
        eventId: eventId === undefined ? undefined : eventId,
        status: patch.status as "DRAFT" | undefined,
        coachingNotes: patch.coachingNotes === undefined ? undefined : patch.coachingNotes,
        effectivenessRating:
          patch.effectivenessRating === undefined ? undefined : patch.effectivenessRating,
        postSessionNotes:
          patch.postSessionNotes === undefined ? undefined : patch.postSessionNotes,
      },
      include: planInclude,
    });
  });
  return shapePlan(updated);
}

export async function deletePlan(session: Session, id: number) {
  const plan = await prisma.trainingPlan.findUnique({ where: { id }, select: { teamId: true } });
  if (!plan) throw new NotFoundError("That session plan wasn't found.");
  if (authorize(session).cannot("delete", "TrainingPlan", { teamId: plan.teamId })) {
    throw new ForbiddenError("You can't delete this session plan.");
  }
  await prisma.trainingPlan.delete({ where: { id } });
}
