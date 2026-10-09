import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getTenantContext } from "@/lib/tenant";
import { planForCaller, linkableSessionsFor } from "@/lib/training-plans";
import { listDrills } from "@/lib/drills";
import { listPlayLibrary } from "@/lib/plays";
import { ApiError } from "@/lib/api/errors";
import type { CourtDiagram } from "@/lib/training";
import PageHeader from "@/components/ui/PageHeader";
import PlanBuilder from "@/app/coach/training/plans/[id]/_components/PlanBuilder";

export default async function PlanPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  let plan;
  try {
    plan = await planForCaller(session!, Number(params.id));
  } catch (e) {
    if (e instanceof ApiError) notFound();
    throw e;
  }

  const { clubId } = await getTenantContext(session!);
  const [drills, plays, sessions] = await Promise.all([
    listDrills(clubId, { includeArchived: true }),
    listPlayLibrary(clubId, { includeArchived: true }),
    plan.isTemplate ? Promise.resolve([]) : linkableSessionsFor(plan.teamId, plan.id),
  ]);

  const linkedDrills = new Set(plan.blocks.map((b) => b.drillId).filter((x) => x != null));
  const linkedPlays = new Set(plan.blocks.map((b) => b.playId).filter((x) => x != null));

  return (
    <main className="flex flex-col gap-8">
      <PageHeader eyebrow="Coach · Session plans" title={plan.title} />
      <PlanBuilder
        plan={{
          id: plan.id,
          teamName: plan.team.name,
          title: plan.title,
          objectives: plan.objectives,
          date: plan.date?.toISOString() ?? null,
          status: plan.status,
          isTemplate: plan.isTemplate,
          coachingNotes: plan.coachingNotes,
          effectivenessRating: plan.effectivenessRating,
          postSessionNotes: plan.postSessionNotes,
          eventId: plan.eventId,
          eventTitle: plan.event?.title ?? null,
          blocks: plan.blocks.map((b) => ({
            category: b.category,
            title: b.title,
            durationMinutes: b.durationMinutes,
            notes: b.notes,
            drillId: b.drillId,
            drillName: b.drill?.name ?? null,
            playId: b.playId,
            courtDiagram: b.courtDiagram as CourtDiagram | null,
          })),
        }}
        // Archived drills and plays only appear when a block here still links them.
        drills={drills
          .filter((d) => d.archivedAt == null || linkedDrills.has(d.id))
          .map((d) => ({
            id: d.id,
            name: d.name,
            category: d.category,
            durationMinutes: d.durationMinutes,
            courtDiagram: d.courtDiagram as CourtDiagram | null,
            archived: d.archivedAt != null,
          }))}
        plays={plays
          .filter((p) => p.archivedAt == null || linkedPlays.has(p.id))
          .map((p) => ({
            id: p.id,
            name: p.name,
            type: p.type,
            courtDiagram: p.courtDiagram as CourtDiagram | null,
            archived: p.archivedAt != null,
          }))}
        sessions={sessions.map((s) => ({ id: s.id, title: s.title, startAt: s.startAt.toISOString() }))}
      />
    </main>
  );
}
