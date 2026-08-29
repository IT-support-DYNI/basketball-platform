import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventDayLabel, eventTimeRange, EVENT_TYPE_LABEL } from "@/lib/events";
import StatusBadge from "@/components/StatusBadge";

/** Read-only for Player, per the PRD permission matrix. */
export default async function PlayerTrainingPage() {
  const session = await getServerSession(authOptions);
  const teamId = session!.user.teamId;

  const events = await prisma.event.findMany({
    where: { OR: [{ teamId: teamId ?? -1 }, { teamId: null }] },
    orderBy: { startAt: "desc" },
    include: { venue: { select: { name: true } } },
  });

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Schedule</h1>
      <p className="mt-1 text-slate-600">Your team&apos;s events — upcoming and past.</p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-surface">
        <table className="w-full min-w-[42rem] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{e.title}</td>
                <td className="px-4 py-3 text-slate-600">{EVENT_TYPE_LABEL[e.type]}</td>
                <td className="px-4 py-3 text-slate-600">{eventDayLabel(e.startAt)}</td>
                <td className="px-4 py-3 text-slate-600">{eventTimeRange(e.startAt, e.endAt)}</td>
                <td className="px-4 py-3 text-slate-600">{e.venue?.name ?? e.locationText ?? "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No events scheduled yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
