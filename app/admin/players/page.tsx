import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getActiveSeason } from "@/lib/season";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { EmptyState } from "@/components/ui/states";

export default async function AdminPlayersPage() {
  const season = await getActiveSeason();
  const memberships = await prisma.teamMembership.findMany({
    where: { seasonId: season.id },
    orderBy: [{ team: { name: "asc" } }, { jerseyNumber: "asc" }],
    include: {
      team: { select: { id: true, name: true } },
      player: { include: { user: { select: { name: true, email: true } } } },
    },
  });

  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Administrator"
        title="Players"
        lead={`Every player on a roster this season (${season.name}). Rosters are edited from each team's page.`}
      />

      {memberships.length === 0 ? (
        <EmptyState title="No players on a roster yet" />
      ) : (
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-2 text-left font-display text-[11px] uppercase tracking-wider text-ink-dim">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Team</th>
                <th className="px-4 py-2.5">#</th>
                <th className="px-4 py-2.5">Position</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {memberships.map((m) => (
                <tr key={m.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 font-medium text-ink">{m.player.user.name}</td>
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/teams/${m.team.id}`} className="font-semibold text-flame-ink hover:underline">
                      {m.team.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 tabular text-ink-dim">{m.jerseyNumber ?? "—"}</td>
                  <td className="px-4 py-2.5 text-ink-dim">{m.position ?? "—"}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
