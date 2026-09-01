import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/StatusBadge";
import { EmptyState } from "@/components/ui/states";
import ReviewRegistrationForm from "@/components/admin/ReviewRegistrationForm";

export default async function AdminRegistrationsPage() {
  const [registrations, teams] = await Promise.all([
    prisma.playerProfile.findMany({
      where: { registrationStatus: { not: "APPROVED" } },
      include: {
        user: { select: { name: true, email: true, createdAt: true } },
        registrationTeam: { select: { id: true, name: true } },
      },
      orderBy: { registrationSubmittedAt: "desc" },
    }),
    prisma.team.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Administrator"
        title="Registrations"
        lead="Review self-registered players and guardians before they get full access."
      />

      {registrations.length === 0 ? (
        <EmptyState title="Nothing awaiting review" description="New registrations will appear here as they come in." />
      ) : (
        <ul className="flex flex-col gap-4">
          {registrations.map((r) => (
            <li key={r.id}>
              <Card as="article">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display font-bold text-ink">{r.user.name}</p>
                      <StatusBadge status={r.registrationStatus} />
                    </div>
                    <p className="text-sm text-ink-dim">{r.user.email}</p>
                    <p className="mt-1 text-sm text-ink-dim">
                      Applied to <span className="font-medium text-ink">{r.registrationTeam?.name ?? "—"}</span>
                      {r.registrationPosition && ` · ${r.registrationPosition}`}
                    </p>
                    {r.dateOfBirth && (
                      <p className="text-xs text-ink-faint">DOB {new Date(r.dateOfBirth).toLocaleDateString()}</p>
                    )}
                    {(r.guardianName || r.guardianContact) && (
                      <p className="text-xs text-ink-faint">
                        Guardian: {r.guardianName} {r.guardianContact}
                      </p>
                    )}
                    {r.registrationSubmittedAt && (
                      <p className="mt-1 text-xs text-ink-faint">
                        Submitted {new Date(r.registrationSubmittedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <ReviewRegistrationForm playerId={r.id} teams={teams} defaultTeamId={r.registrationTeamId} />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
