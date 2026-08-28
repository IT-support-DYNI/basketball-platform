import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";

export default async function CoachMyTeamsPage() {
  const session = await getServerSession(authOptions);

  const teams = await prisma.team.findMany({
    where: { id: { in: session!.user.teamIds ?? [] } },
    orderBy: { name: "asc" },
    include: { _count: { select: { memberships: { where: { status: { notIn: ["FORMER"] } } } } } },
  });

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">My Teams</h1>
      <p className="mt-1 text-slate-600">Teams assigned to you by an admin.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {teams.map((team) => (
          <Link
            key={team.id}
            href={`/coach/my-teams/${team.id}`}
            className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900">{team.name}</p>
                {team.ageGroup && <p className="text-sm text-slate-500">{team.ageGroup}</p>}
              </div>
              <StatusBadge status={team.status} />
            </div>
            <p className="mt-3 text-sm text-slate-500">{team._count.memberships} players</p>
          </Link>
        ))}
        {teams.length === 0 && <p className="text-sm text-slate-500">No teams assigned to you yet — ask an admin.</p>}
      </div>
    </main>
  );
}
