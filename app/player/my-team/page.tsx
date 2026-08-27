import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PlayerMyTeamPage() {
  const session = await getServerSession(authOptions);
  const teamId = session!.user.teamId;

  const team = teamId
    ? await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          players: { include: { user: true }, orderBy: { jerseyNumber: "asc" } },
          coaches: { include: { coach: { include: { user: true } } } },
        },
      })
    : null;

  if (!team) {
    return (
      <main>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">My Team</h1>
        <p className="mt-3 text-sm text-slate-500">You're not assigned to a team yet — ask your coach or admin.</p>
      </main>
    );
  }

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{team.name}</h1>
      {team.ageGroup && <p className="mt-1 text-slate-600">{team.ageGroup}</p>}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-surface p-5">
        <h2 className="font-bold text-slate-900">Coaches</h2>
        <ul className="mt-3 space-y-1 text-sm text-slate-700">
          {team.coaches.map((tc) => <li key={tc.id}>{tc.coach.user.name}{tc.isPrimary ? " (Head coach)" : ""}</li>)}
          {team.coaches.length === 0 && <p className="text-slate-500">No coach assigned yet.</p>}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-surface p-5">
        <h2 className="font-bold text-slate-900">Roster ({team.players.length})</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {team.players.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2 text-sm">
              <span className="font-medium text-slate-800">
                {p.jerseyNumber != null ? `#${p.jerseyNumber} ` : ""}{p.user.name}
              </span>
              <span className="text-slate-500">{p.position ?? "—"}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
