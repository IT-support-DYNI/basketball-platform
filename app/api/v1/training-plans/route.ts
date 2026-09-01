import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, created } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { createTrainingPlanSchema } from "@/lib/contracts/training";
import { listPlans, createPlan } from "@/lib/training-plans";

/** The team ids the caller can see plans for. */
function callerTeamIds(session: Awaited<ReturnType<typeof requireAuth>>): number[] {
  if (session.user.role === "COACH") return session.user.teamIds ?? [];
  if (session.user.role === "PLAYER" && session.user.teamId != null) return [session.user.teamId];
  return [];
}

/** GET /api/v1/training-plans — plans for the caller's teams.
 *  `?status=&templates=1` */
export const GET = route(async (req: NextRequest, { requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const sp = req.nextUrl.searchParams;
  const items = await listPlans(callerTeamIds(session), {
    status: sp.get("status"),
    templates: sp.get("templates") === "1",
  });
  // Players only see published plans.
  const visible = session.user.role === "PLAYER" ? items.filter((p) => p.status === "PUBLISHED") : items;
  return ok(visible, { requestId });
});

/** POST /api/v1/training-plans — start a new plan (optionally from a template). */
export const POST = route(async (req: NextRequest, { requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const body = createTrainingPlanSchema.parse(await req.json());
  const plan = await createPlan(session, body);
  return created(plan, requestId);
});
