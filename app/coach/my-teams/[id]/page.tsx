import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AddPlayerForm from "@/components/shared/AddPlayerForm";
import RemovePlayerButton from "@/components/shared/RemovePlayerButton";

export default async function CoachTeamDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const teamId = Number(params.id);

  if (!session?.user.teamIds?.includes(teamId)) redirect("/coach/my-teams");

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { players: { include: { user: true }, orderBy: { jerseyNumber: "asc" } } },
  });
  if (!team) notFound();

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{team.name}</h1>
      {team.ageGroup && <p className="mt-1 text-slate-600">{team.ageGroup}</p>}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-surface p-5">
        <h2 className="font-bold text-slate-900">Roster ({team.players.length})</h2>

        <ul className="mt-3 divide-y divide-slate-100">
          {team.players.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="font-medium text-slate-800">
                  {p.jerseyNumber != null ? `#${p.jerseyNumber} ` : ""}
                  {p.user.name}
                </p>
                <p className="text-xs text-slate-500">{p.position ?? "No position set"} · {p.user.email}</p>
              </div>
              <RemovePlayerButton teamId={team.id} playerId={p.id} />
            </li>
          ))}
          {team.players.length === 0 && <p className="py-2 text-sm text-slate-500">No players on this roster yet.</p>}
        </ul>

        <div className="mt-4">
          <AddPlayerForm teamId={team.id} />
        </div>
      </section>
    </main>
  );
}
