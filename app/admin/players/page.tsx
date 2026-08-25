import Link from "next/link";

import { prisma } from "@/lib/prisma";

export default async function AdminPlayersPage() {
  const players = await prisma.playerProfile.findMany({
    include: { user: true, team: { select: { id: true, name: true } } },
    orderBy: { user: { name: "asc" } },
  });

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Players</h1>
      <p className="mt-1 text-slate-600">Every player across every team. Rosters are edited from each team's page.</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Jersey #</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {players.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{p.user.name}</td>
                <td className="px-4 py-3 text-slate-600">
                  {p.team ? (
                    <Link href={`/admin/teams/${p.team.id}`} className="font-semibold text-court-700 hover:text-court-800">
                      {p.team.name}
                    </Link>
                  ) : (
                    <span className="text-slate-400">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{p.position ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{p.jerseyNumber ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{p.status}</td>
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
