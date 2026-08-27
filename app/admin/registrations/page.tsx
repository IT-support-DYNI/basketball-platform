import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import ReviewRegistrationForm from "@/components/admin/ReviewRegistrationForm";

export default async function AdminRegistrationsPage() {
  const [registrations, teams] = await Promise.all([
    prisma.playerProfile.findMany({
      where: { registrationStatus: { not: "APPROVED" } },
      include: {
        user: { select: { name: true, email: true, createdAt: true } },
        team: { select: { id: true, name: true } },
      },
      orderBy: { registrationSubmittedAt: "desc" },
    }),
    prisma.team.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Registrations</h1>
      <p className="mt-1 text-slate-600">Review self-registered players before they get full access.</p>

      <div className="mt-6 space-y-4">
        {registrations.map((r) => (
          <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-900">{r.user.name}</p>
                  <StatusBadge status={r.registrationStatus} />
                </div>
                <p className="text-sm text-slate-500">{r.user.email}</p>
                <p className="mt-1 text-sm text-slate-600">
                  Applied to: <span className="font-medium">{r.team?.name ?? "—"}</span>
                  {r.position && ` · ${r.position}`}
                  {r.jerseyNumber != null && ` · #${r.jerseyNumber}`}
                </p>
                {r.dateOfBirth && (
                  <p className="text-xs text-slate-400">DOB: {new Date(r.dateOfBirth).toLocaleDateString()}</p>
                )}
                {(r.guardianName || r.guardianContact) && (
                  <p className="text-xs text-slate-400">Guardian: {r.guardianName} {r.guardianContact}</p>
                )}
                {r.registrationSubmittedAt && (
                  <p className="mt-1 text-xs text-slate-400">
                    Submitted {new Date(r.registrationSubmittedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <ReviewRegistrationForm playerId={r.id} teams={teams} defaultTeamId={r.teamId} />
          </div>
        ))}

        {registrations.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No registrations awaiting review.
          </p>
        )}
      </div>
    </main>
  );
}
