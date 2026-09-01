import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AttendanceReport from "@/components/reports/AttendanceReport";

export default async function CoachAttendancePage() {
  const session = await getServerSession(authOptions);
  const teamIds = session!.user.teamIds ?? [];

  const [teams, recentEvents] = await Promise.all([
    prisma.team.findMany({ where: { id: { in: teamIds } }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.event.findMany({
      where: { teamId: { in: teamIds } },
      orderBy: { startAt: "desc" },
      take: 10,
      include: { team: { select: { name: true } } },
    }),
  ]);

  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Attendance</h1>
        <p className="mt-1 text-ink-dim">Per-player rates over a date range. Mark or correct attendance from a specific event.</p>
      </div>

      <section className="rounded-card border border-line bg-surface p-5">
        <AttendanceReport teams={teams} />
      </section>

      <section className="rounded-card border border-line bg-surface p-5">
        <h2 className="font-bold text-ink">Recent events</h2>
        <ul className="mt-3 divide-y divide-line">
          {recentEvents.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="font-medium text-ink">
                {e.title} · {e.team?.name ?? "Club-wide"} · {new Date(e.startAt).toLocaleDateString()}
              </span>
              <Link href={`/coach/training/${e.id}`} className="text-xs font-semibold text-flame-ink hover:underline">
                Mark attendance →
              </Link>
            </li>
          ))}
          {recentEvents.length === 0 && <p className="py-2 text-sm text-ink-dim">No events yet.</p>}
        </ul>
      </section>
    </main>
  );
}
