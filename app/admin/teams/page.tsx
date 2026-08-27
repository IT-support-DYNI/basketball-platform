import Link from "next/link";

import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import CreateTeamForm from "@/components/admin/CreateTeamForm";

export default async function AdminTeamsPage() {
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { players: true, coaches: true } } },
  });

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Teams</h1>
      <p className="mt-1 text-slate-600">Create teams and assign coaches — rosters are managed on each team's page.</p>

      <div className="mt-6">
        <CreateTeamForm />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {teams.map((team) => (
          <Link
            key={team.id}
            href={`/admin/teams/${team.id}`}
            className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900">{team.name}</p>
                {team.ageGroup && <p className="text-sm text-slate-500">{team.ageGroup}</p>}
              </div>
              <StatusBadge status={team.status} />
            </div>
            <p className="mt-3 text-sm text-slate-500">
              {team._count.players} players · {team._count.coaches} coaches
            </p>
          </Link>
        ))}

        {teams.length === 0 && (
          <p className="text-sm text-slate-500">No teams yet.</p>
        )}
      </div>
    </main>
  );
}
