import Link from "next/link";

import { prisma } from "@/lib/prisma";

export default async function AdminCoachesPage() {
  const coaches = await prisma.coachProfile.findMany({
    include: { user: true, teams: { include: { team: { select: { id: true, name: true } } } } },
    orderBy: { user: { name: "asc" } },
  });

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Coaches</h1>
      <p className="mt-1 text-slate-600">
        Every coach on the platform and the teams they manage. Create new coach accounts from{" "}
        <Link href="/admin/users" className="font-semibold text-court-700 hover:text-court-800">Users</Link>.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {coaches.map((c) => (
          <div key={c.id} className="rounded-2xl border border-slate-200 bg-surface p-5">
            <p className="font-bold text-slate-900">{c.user.name}</p>
            <p className="text-sm text-slate-500">{c.user.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {c.teams.length === 0 ? (
                <span className="text-xs text-slate-400">No teams assigned</span>
              ) : (
                c.teams.map((tc) => (
                  <Link
                    key={tc.id}
                    href={`/admin/teams/${tc.team.id}`}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    {tc.team.name}
                  </Link>
                ))
              )}
            </div>
          </div>
        ))}
        {coaches.length === 0 && <p className="text-sm text-slate-500">No coaches yet.</p>}
      </div>
    </main>
  );
}
