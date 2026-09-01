import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getTenantContext } from "@/lib/tenant";
import { listDrills } from "@/lib/drills";
import PageHeader from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import DrillLibrary from "@/components/training/DrillLibrary";

export const metadata = { title: "Drills" };

export default async function CoachDrillsPage() {
  const session = await getServerSession(authOptions);
  const { clubId } = await getTenantContext(session!);
  const drills = await listDrills(clubId);

  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Coach"
        title="Drill library"
        lead="The club's shared bank of practice drills. Anything here can be dropped into a session plan."
        actions={<ButtonLink href="/coach/drills/new">New drill</ButtonLink>}
      />
      <DrillLibrary
        drills={drills.map((d) => ({
          id: d.id,
          name: d.name,
          category: d.category,
          difficulty: d.difficulty,
          summary: d.summary,
          durationMinutes: d.durationMinutes,
          minPlayers: d.minPlayers,
          maxPlayers: d.maxPlayers,
          tags: d.tags,
          shared: d.clubId == null,
          archived: d.archivedAt != null,
        }))}
      />
    </main>
  );
}
