import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import TeamManager from "@/components/admin/TeamManager";

export default async function CoachTeamDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const teamId = Number(params.id);

  if (!session?.user.teamIds?.includes(teamId)) redirect("/coach/my-teams");

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) notFound();

  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Team"
        title={team.name}
        lead={team.ageGroup ?? undefined}
      />
      <TeamManager teamId={team.id} isAdmin={false} />
    </main>
  );
}
