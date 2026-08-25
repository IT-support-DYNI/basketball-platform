import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import AssignCoachForm from "@/components/admin/AssignCoachForm";
import RemoveCoachButton from "@/components/admin/RemoveCoachButton";
import ArchiveTeamButton from "@/components/admin/ArchiveTeamButton";
import AddPlayerForm from "@/components/shared/AddPlayerForm";
import RemovePlayerButton from "@/components/shared/RemovePlayerButton";

export default async function AdminTeamDetailPage({ params }: { params: { id: string } }) {
  const teamId = Number(params.id);

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      coaches: { include: { coach: { include: { user: true } } } },
      players: { include: { user: true }, orderBy: { jerseyNumber: "asc" } },
    },
  });
  if (!team) notFound();

  const assignedCoachIds = team.coaches.map((tc) => tc.coachProfileId);
  const availableCoaches = await prisma.coachProfile.findMany({
    where: { id: { notIn: assignedCoachIds } },
    include: { user: true },
  });

  return (
    <main>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{team.name}</h1>
            <StatusBadge status={team.status} />
          </div>
          {team.ageGroup && <p className="mt-1 text-slate-600">{team.ageGroup}</p>}
          {team.description && <p className="mt-1 text-slate-500">{team.description}</p>}
        </div>
        <ArchiveTeamButton teamId={team.id} status={team.status} />
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-slate-900">Coaches</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {team.coaches.map((tc) => (
            <li key={tc.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="font-medium text-slate-800">{tc.coach.user.name}</p>
                <p className="text-xs text-slate-500">{tc.coach.user.email}{tc.isPrimary ? " · Head coach" : ""}</p>
              </div>
              <RemoveCoachButton teamId={team.id} coachProfileId={tc.coachProfileId} />
            </li>
          ))}
          {team.coaches.length === 0 && <p className="py-2 text-sm text-slate-500">No coach assigned yet.</p>}
        </ul>

        <div className="mt-4">
          <AssignCoachForm
            teamId={team.id}
            options={availableCoaches.map((c) => ({ coachProfileId: c.id, name: c.user.name, email: c.user.email }))}
          />
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Roster ({team.players.length})</h2>
        </div>

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
