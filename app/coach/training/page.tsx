import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateCalendarToken } from "@/lib/calendar-feed";
import { baseUrl } from "@/lib/base-url";
import CalendarView from "@/components/calendar/CalendarView";
import CreateSessionForm from "@/components/coach/CreateSessionForm";

export default async function CoachSchedulePage() {
  const session = await getServerSession(authOptions);
  const teamIds = session!.user.teamIds ?? [];

  const [teams, venues, token] = await Promise.all([
    prisma.team.findMany({ where: { id: { in: teamIds } }, select: { id: true, name: true } }),
    prisma.venue.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    getOrCreateCalendarToken(Number(session!.user.id)),
  ]);

  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Schedule</h1>
        <p className="mt-1 text-ink-dim">Create, edit, and cancel events for your team(s).</p>
      </div>

      <CreateSessionForm teams={teams} venues={venues} />

      <CalendarView
        manageBasePath="/coach/training"
        feedUrl={`${baseUrl()}/api/v1/public/calendar.ics?token=${token}`}
      />
    </main>
  );
}
