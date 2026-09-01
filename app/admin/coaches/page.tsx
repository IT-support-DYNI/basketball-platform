import Link from "next/link";

import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/states";

export default async function AdminCoachesPage() {
  const coaches = await prisma.user.findMany({
    where: { role: "COACH" },
    orderBy: { name: "asc" },
    include: { staffAssignments: { include: { team: { select: { id: true, name: true } } } } },
  });

  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Administrator"
        title="Coaches"
        lead={
          <>
            Every coach and the teams they&apos;re on. Create accounts from{" "}
            <Link href="/admin/users" className="font-semibold text-flame-ink hover:underline">
              Members
            </Link>
            ; assign them on each team&apos;s page.
          </>
        }
      />

      {coaches.length === 0 ? (
        <EmptyState title="No coaches yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {coaches.map((c) => {
            const teams = [...new Map(c.staffAssignments.map((a) => [a.team.id, a.team])).values()];
            return (
              <Card key={c.id}>
                <p className="font-display font-bold text-ink">{c.name}</p>
                <p className="text-sm text-ink-faint">{c.email}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {teams.length === 0 ? (
                    <span className="text-xs text-ink-faint">No teams assigned</span>
                  ) : (
                    teams.map((t) => (
                      <Link
                        key={t.id}
                        href={`/admin/teams/${t.id}`}
                        className="rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs font-semibold text-ink-dim hover:text-ink"
                      >
                        {t.name}
                      </Link>
                    ))
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
