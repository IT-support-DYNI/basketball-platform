import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { childrenOf } from "@/lib/guardian";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { EmptyState } from "@/components/ui/states";

export default async function GuardianDashboardPage() {
  const session = await getServerSession(authOptions);
  const children = await childrenOf(Number(session!.user.id));

  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Guardian"
        title="My children"
        lead={`Welcome, ${session?.user?.name?.split(" ")[0] ?? ""}. Everything the club needs from you, in one place.`}
      />

      {children.length === 0 ? (
        <EmptyState title="No children linked yet" description="Contact the club administrator if this looks wrong." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {children.map((c) => (
            <li key={c.playerProfileId} className="rounded-card border border-line bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-bold text-ink">{c.name}</p>
                  <p className="text-xs text-ink-faint">
                    {c.relationshipLabel} · {c.team?.name ?? "team to be confirmed"}
                  </p>
                </div>
                <StatusBadge status={c.registrationStatus} />
              </div>

              {c.registrationStatus !== "APPROVED" && c.registrationReviewNote && (
                <p className="mt-3 rounded-control border border-warning/40 bg-warning/10 p-2.5 text-xs text-warning">
                  {c.registrationReviewNote}
                </p>
              )}

              <div className="mt-4 space-y-2 text-sm">
                {c.outstandingConsents > 0 ? (
                  <Link
                    href={`/consent?child=${c.playerProfileId}`}
                    className="flex items-center justify-between rounded-control border border-flame/40 bg-flame/10 px-3 py-2 font-semibold text-flame-ink"
                  >
                    {c.outstandingConsents} document{c.outstandingConsents === 1 ? "" : "s"} to accept
                    <span aria-hidden>→</span>
                  </Link>
                ) : (
                  <p className="text-xs text-success">All club documents accepted ✓</p>
                )}

                {c.nextEvent && (
                  <p className="text-ink-dim">
                    Next: <span className="text-ink">{c.nextEvent.title}</span> ·{" "}
                    {new Date(c.nextEvent.startAt).toLocaleDateString(undefined, {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
