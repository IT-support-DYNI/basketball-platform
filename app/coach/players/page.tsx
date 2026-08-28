import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSeason } from "@/lib/season";
import PageHeader from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/states";

export default async function CoachPlayersPage() {
  const session = await getServerSession(authOptions);
  const teamIds = session!.user.teamIds ?? [];
  const season = await getActiveSeason();

  const memberships = await prisma.teamMembership.findMany({
    where: { teamId: { in: teamIds }, seasonId: season.id, status: { notIn: ["FORMER"] } },
    orderBy: [{ team: { name: "asc" } }, { jerseyNumber: "asc" }],
    include: {
      team: { select: { name: true } },
      player: { include: { user: { select: { name: true } } } },
    },
  });

  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Coach"
        title="Players"
        lead={
          <>
            Everyone on your roster this season. Manage the roster from{" "}
            <Link href="/coach/my-teams" className="font-semibold text-flame-ink hover:underline">
              Team
            </Link>
            .
          </>
        }
      />

      {memberships.length === 0 ? (
        <EmptyState title="No players on your roster yet" />
      ) : (
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-2 text-left font-display text-[11px] uppercase tracking-wider text-ink-dim">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Team</th>
                <th className="px-4 py-2.5">#</th>
                <th className="px-4 py-2.5">Position</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {memberships.map((m) => (
                <tr key={m.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 font-medium text-ink">{m.player.user.name}</td>
                  <td className="px-4 py-2.5 text-ink-dim">{m.team.name}</td>
                  <td className="px-4 py-2.5 tabular text-ink-dim">{m.jerseyNumber ?? "—"}</td>
                  <td className="px-4 py-2.5 text-ink-dim">{m.position ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={`/coach/performance?playerId=${m.player.id}`}
                      className="text-xs font-semibold text-flame-ink hover:underline"
                    >
                      View performance
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
