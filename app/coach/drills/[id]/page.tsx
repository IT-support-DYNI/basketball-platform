import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getTenantContext } from "@/lib/tenant";
import { drillById } from "@/lib/drills";
import { authorize } from "@/lib/authz/guard";
import PageHeader from "@/components/ui/PageHeader";
import DrillDetail from "@/components/training/DrillDetail";

export default async function DrillPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const { clubId } = await getTenantContext(session!);
  const drill = await drillById(clubId, Number(params.id));
  if (!drill) notFound();

  const canDelete = authorize(session!).can("delete", "Drill", { createdByUserId: drill.createdByUserId });

  return (
    <main className="flex flex-col gap-8">
      <PageHeader eyebrow="Coach · Drill library" title={drill.name} />
      <DrillDetail
        drill={{
          id: drill.id,
          name: drill.name,
          category: drill.category,
          difficulty: drill.difficulty,
          summary: drill.summary,
          instructions: drill.instructions,
          coachingPoints: drill.coachingPoints,
          commonMistakes: drill.commonMistakes,
          durationMinutes: drill.durationMinutes,
          minPlayers: drill.minPlayers,
          maxPlayers: drill.maxPlayers,
          equipment: drill.equipment,
          tags: drill.tags,
          courtDiagram: (drill.courtDiagram as never) ?? null,
          shared: drill.clubId == null,
          archived: drill.archivedAt != null,
          createdByName: drill.createdBy?.name ?? null,
          canDelete,
        }}
      />
    </main>
  );
}
