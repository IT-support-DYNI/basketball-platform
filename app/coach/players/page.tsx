import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CoachPlayersPage() {
  const session = await getServerSession(authOptions);
  const teamIds = session!.user.teamIds ?? [];

  const players = await prisma.playerProfile.findMany({
    where: { teamId: { in: teamIds } },
    include: { user: true, team: { select: { id: true, name: true } } },
    orderBy: { user: { name: "asc" } },
  });

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Players</h1>
      <p className="mt-1 text-slate-600">
        Every player on your team(s). Add or remove players from{" "}
        <Link href="/coach/my-teams" className="font-semibold text-court-700 hover:text-court-800">My Teams</Link>.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Jersey #</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {players.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{p.user.name}</td>
                <td className="px-4 py-3 text-slate-600">{p.team?.name}</td>
                <td className="px-4 py-3 text-slate-600">{p.position ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{p.jerseyNumber ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/coach/performance?playerId=${p.id}`} className="text-xs font-semibold text-court-700 hover:text-court-800">
                    View performance
                  </Link>
                </td>
              </tr>
            ))}
            {players.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">No players yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
