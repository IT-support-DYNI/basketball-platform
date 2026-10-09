import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getTenantContext } from "@/lib/tenant";
import { assignableTeams, libraryPlay } from "@/lib/plays";
import { authorize } from "@/lib/authz/guard";
import type { CourtDiagram } from "@/lib/training";
import PageHeader from "@/components/ui/PageHeader";
import PlayDetail from "@/app/coach/plays/[id]/_components/PlayDetail";

export const metadata = { title: "Play" };

export default async function CoachPlayPage({ params }: { params: { id: string } }) {
  const session = (await getServerSession(authOptions))!;
  const { clubId } = await getTenantContext(session);
  const play = await libraryPlay(clubId, Number(params.id));
  if (!play) notFound();
  const myTeams = await assignableTeams(session, clubId);
  const canEdit = authorize(session).can("update", "Play", { createdByUserId: play.createdByUserId });

  return (
    <main className="flex flex-col gap-8">
      <PageHeader eyebrow={play.archivedAt ? "Coach · Plays · Archived" : "Coach · Plays"} title={play.name} />
      <PlayDetail
        myTeams={myTeams}
        play={{
          id: play.id,
          name: play.name,
          type: play.type,
          notes: play.notes,
          courtDiagram: play.courtDiagram as CourtDiagram | null,
          archived: play.archivedAt != null,
          createdByName: play.createdBy?.name ?? null,
          updatedAt: play.updatedAt.toISOString(),
          assignedTeams: play.assignments.map((a) => a.team),
          canEdit,
        }}
      />
    </main>
  );
}
