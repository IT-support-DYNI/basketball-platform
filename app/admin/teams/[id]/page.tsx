import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import PageHeader from "@/components/ui/PageHeader";
import ArchiveTeamButton from "@/components/admin/ArchiveTeamButton";
import TeamManager from "@/components/admin/TeamManager";

export default async function AdminTeamDetailPage({ params }: { params: { id: string } }) {
  const teamId = Number(params.id);
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) notFound();

  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Team"
        title={
          <span className="flex flex-wrap items-center gap-3">
            {team.name}
            <StatusBadge status={team.status} />
          </span>
        }
        lead={[team.ageGroup, team.description].filter(Boolean).join(" · ") || undefined}
        actions={<ArchiveTeamButton teamId={team.id} status={team.status} />}
      />
      <TeamManager teamId={team.id} isAdmin />
    </main>
  );
}
