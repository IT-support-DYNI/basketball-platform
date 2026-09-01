import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getTenantContext } from "@/lib/tenant";
import { planForCaller } from "@/lib/training-plans";
import { listDrills } from "@/lib/drills";
import { ApiError } from "@/lib/api/errors";
import PageHeader from "@/components/ui/PageHeader";
import PlanBuilder from "@/components/training/PlanBuilder";

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
  const drills = await listDrills(clubId);

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
          eventTitle: plan.event?.title ?? null,
          blocks: plan.blocks.map((b) => ({
            category: b.category,
            title: b.title,
            durationMinutes: b.durationMinutes,
            notes: b.notes,
            drillId: b.drillId,
            drillName: b.drill?.name ?? null,
          })),
        }}
        drills={drills
          .filter((d) => d.archivedAt == null)
          .map((d) => ({ id: d.id, name: d.name, category: d.category, durationMinutes: d.durationMinutes }))}
      />
    </main>
  );
}
