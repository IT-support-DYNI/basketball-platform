import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, noContent } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { updateTrainingPlanSchema } from "@/lib/contracts/training";
import { planForCaller, updatePlan, deletePlan } from "@/lib/training-plans";

export const GET = route<{ id: string }>(async (_req, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  return ok(await planForCaller(session, Number(params.id)));
});

export const PATCH = route<{ id: string }>(async (req: NextRequest, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const body = updateTrainingPlanSchema.parse(await req.json());
  return ok(await updatePlan(session, Number(params.id), body));
});

export const DELETE = route<{ id: string }>(async (_req, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  await deletePlan(session, Number(params.id));
  return noContent();
});
