import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSeason } from "@/lib/season";

const STAFF_ROLE_LABEL: Record<string, string> = {
  HEAD_COACH: "Head coach",
  ASSISTANT_COACH: "Assistant coach",
  TEAM_MANAGER: "Team manager",
  STATISTICIAN: "Statistician",
  MEDICAL_OFFICER: "Medical officer",
  WELFARE_OFFICER: "Welfare officer",
};

export default async function PlayerMyTeamPage() {
  const session = await getServerSession(authOptions);
  const teamId = session!.user.teamId;

  const season = await getActiveSeason();
  const team = teamId
    ? await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          memberships: {
            where: { seasonId: season.id, status: { notIn: ["FORMER", "INACTIVE"] } },
            orderBy: { jerseyNumber: "asc" },
            include: { player: { include: { user: { select: { name: true } } } } },
          },
          staffAssignments: {
            include: { user: { select: { name: true } } },
          },
        },
      })
    : null;

  if (!team) {
    return (
      <main>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">My Team</h1>
        <p className="mt-3 text-sm text-slate-500">You&apos;re not assigned to a team yet — ask your coach or admin.</p>
      </main>
    );
  }

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{team.name}</h1>
      {team.ageGroup && <p className="mt-1 text-slate-600">{team.ageGroup}</p>}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-surface p-5">
        <h2 className="font-bold text-slate-900">Staff</h2>
        <ul className="mt-3 space-y-1 text-sm text-slate-700">
          {team.staffAssignments.map((a) => (
            <li key={a.id}>
              {a.user.name} <span className="text-slate-400">· {STAFF_ROLE_LABEL[a.role] ?? a.role}</span>
            </li>
          ))}
          {team.staffAssignments.length === 0 && <p className="text-slate-500">No staff assigned yet.</p>}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-surface p-5">
        <h2 className="font-bold text-slate-900">Roster ({team.memberships.length})</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {team.memberships.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-2 text-sm">
              <span className="font-medium text-slate-800">
                {m.jerseyNumber != null ? `#${m.jerseyNumber} ` : ""}{m.player.user.name}
              </span>
              <span className="text-slate-500">{m.position ?? "—"}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
