import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { planForCaller } from "@/lib/training-plans";
import { ApiError } from "@/lib/api/errors";
import type { CourtDiagram } from "@/lib/training";
import PageHeader from "@/components/ui/PageHeader";
import PlanReadView from "@/components/shared/calendar/PlanReadView";

/**
 * A player's own direct link to a published session/match plan — the same
 * data the calendar dialog shows inline, but as a real page they can open,
 * bookmark, or come back to, not just a popup. planForCaller already scopes
 * this to PUBLISHED plans for the player's own team (lib/authz/ability.ts),
 * so a draft or another team's plan 404s here the same as it does anywhere else.
 */
export default async function PlayerPlanPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  let plan;
  try {
    plan = await planForCaller(session!, Number(params.id));
  } catch (e) {
    if (e instanceof ApiError) notFound();
    throw e;
  }
  if (plan.status !== "PUBLISHED") notFound();

  return (
    <main className="flex flex-col gap-6">
      <PageHeader
        eyebrow={plan.event?.title ? `${plan.team.name} · ${plan.event.title}` : plan.team.name}
        title={plan.title}
      />
      <div className="rounded-card border border-line bg-surface p-5">
        <PlanReadView
          plan={{
            title: plan.title,
            objectives: plan.objectives,
            blocks: plan.blocks.map((b) => ({
              category: b.category,
              title: b.title,
              durationMinutes: b.durationMinutes,
              notes: b.notes,
              drillName: b.drill?.name ?? null,
              courtDiagram: b.courtDiagram as CourtDiagram | null,
            })),
          }}
        />
      </div>
      <Link href="/player/training" className="text-sm font-semibold text-ink-dim hover:text-ink">
        ← Back to schedule
      </Link>
    </main>
  );
}
