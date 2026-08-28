import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getActiveSeason } from "@/lib/season";
import StatusBadge from "@/components/StatusBadge";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/states";
import CreateTeamForm from "@/components/admin/CreateTeamForm";

export default async function AdminTeamsPage() {
  const season = await getActiveSeason();
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          memberships: { where: { seasonId: season.id, status: { notIn: ["FORMER"] } } },
          staffAssignments: true,
        },
      },
    },
  });

  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Administrator"
        title="Teams"
        lead={`Rosters, squads and staff are managed per team. Current season: ${season.name}.`}
      />

      <CreateTeamForm />

      {teams.length === 0 ? (
        <EmptyState title="No teams yet" description="Create the club's first team above." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {teams.map((team) => (
            <Link key={team.id} href={`/admin/teams/${team.id}`} className="block">
              <Card className="h-full transition hover:border-line-strong">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-bold text-ink">{team.name}</p>
                    {team.ageGroup && <p className="text-sm text-ink-faint">{team.ageGroup}</p>}
                  </div>
                  <StatusBadge status={team.status} />
                </div>
                <p className="mt-3 text-sm text-ink-dim">
                  {team._count.memberships} players · {team._count.staffAssignments} staff
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
