import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventDayLabel, eventTimeRange, EVENT_TYPE_LABEL } from "@/lib/events";
import StatusBadge from "@/components/StatusBadge";
import CreateSessionForm from "@/components/coach/CreateSessionForm";

export default async function CoachTrainingPage() {
  const session = await getServerSession(authOptions);
  const teamIds = session!.user.teamIds ?? [];

  const [teams, venues, events] = await Promise.all([
    prisma.team.findMany({ where: { id: { in: teamIds } }, select: { id: true, name: true } }),
    prisma.venue.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.event.findMany({
      where: { OR: [{ teamId: { in: teamIds } }, { teamId: null }] },
      orderBy: { startAt: "desc" },
      include: { team: { select: { name: true } }, venue: { select: { name: true } } },
    }),
  ]);

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Schedule</h1>
      <p className="mt-1 text-slate-600">Create, edit, and cancel events for your team(s).</p>

      <div className="mt-6">
        <CreateSessionForm teams={teams} venues={venues} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-surface">
        <table className="w-full min-w-[42rem] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{e.team?.name ?? "Club-wide"}</td>
                <td className="px-4 py-3 text-slate-600">{e.title}</td>
                <td className="px-4 py-3 text-slate-600">{EVENT_TYPE_LABEL[e.type]}</td>
                <td className="px-4 py-3 text-slate-600">{eventDayLabel(e.startAt)}</td>
                <td className="px-4 py-3 text-slate-600">{eventTimeRange(e.startAt, e.endAt)}</td>
                <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/coach/training/${e.id}`} className="text-xs font-semibold text-court-700 hover:text-court-800">
                    Manage →
                  </Link>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">No events yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
