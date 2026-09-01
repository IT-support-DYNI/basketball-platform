import type { Prisma } from "@prisma/client";
import type { Session } from "next-auth";

import { prisma } from "./prisma";
import { authorize } from "./authz/guard";
import { ForbiddenError, NotFoundError } from "./api/errors";
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
        select: { id: true, name: true, category: true, difficulty: true, durationMinutes: true, archivedAt: true },
      },
    },
  },
} satisfies import("@prisma/client").Prisma.TrainingPlanInclude;

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

/** A plan the caller may see, with blocks + drills. Throws 404/403. */
export async function planForCaller(session: Session, id: number) {
  const plan = await prisma.trainingPlan.findUnique({ where: { id }, include: planInclude });
  if (!plan) throw new NotFoundError("That session plan wasn't found.");

  const scope = { teamId: plan.teamId, status: plan.status };
  if (authorize(session).cannot("read", "TrainingPlan", scope)) {
    throw new ForbiddenError("You don't have access to this session plan.");
  }
  return plan;
}

export async function createPlan(
  session: Session,
  input: { teamId: number; title: string; objectives?: string; date?: string; isTemplate?: boolean; fromTemplateId?: number },
) {
  if (authorize(session).cannot("create", "TrainingPlan", { teamId: input.teamId })) {
    throw new ForbiddenError("You don't coach that team.");
  }
  const { clubId } = await getTenantContext(session);
  const season = await getActiveSeason(clubId);

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
      ...(b.drillId != null ? { drill: { connect: { id: b.drillId } } } : {}),
    }));
  }

  return prisma.trainingPlan.create({
    data: {
      teamId: input.teamId,
      seasonId: season.id,
      title: input.title,
      objectives,
      date: input.date ? new Date(input.date) : null,
      isTemplate: input.isTemplate ?? false,
      templateOfId: input.fromTemplateId,
      createdByUserId: Number(session.user.id),
      ...(blockCreate ? { blocks: { create: blockCreate } } : {}),
    },
    include: planInclude,
  });
}

type BlockInput = {
  category: string;
  title?: string;
  durationMinutes?: number;
  notes?: string;
  drillId?: number | null;
};

export async function updatePlan(
  session: Session,
  id: number,
  patch: {
    title?: string;
    objectives?: string | null;
    date?: string | null;
    status?: string;
    coachingNotes?: string | null;
    effectivenessRating?: number | null;
    postSessionNotes?: string | null;
    blocks?: BlockInput[];
  },
) {
  const plan = await prisma.trainingPlan.findUnique({ where: { id }, select: { teamId: true } });
  if (!plan) throw new NotFoundError("That session plan wasn't found.");
  if (authorize(session).cannot("update", "TrainingPlan", { teamId: plan.teamId })) {
    throw new ForbiddenError("You can't edit this session plan.");
  }

  return prisma.$transaction(async (tx) => {
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
}

export async function deletePlan(session: Session, id: number) {
  const plan = await prisma.trainingPlan.findUnique({ where: { id }, select: { teamId: true } });
  if (!plan) throw new NotFoundError("That session plan wasn't found.");
  if (authorize(session).cannot("delete", "TrainingPlan", { teamId: plan.teamId })) {
    throw new ForbiddenError("You can't delete this session plan.");
  }
  await prisma.trainingPlan.delete({ where: { id } });
}
