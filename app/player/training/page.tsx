import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getOrCreateCalendarToken } from "@/lib/calendar-feed";
import { baseUrl } from "@/lib/base-url";
import CalendarView from "@/components/calendar/CalendarView";

/** Read-only for Player, per the PRD permission matrix. */
export default async function PlayerSchedulePage() {
  const session = await getServerSession(authOptions);
  const token = await getOrCreateCalendarToken(Number(session!.user.id));

  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Schedule</h1>
        <p className="mt-1 text-ink-dim">Your team&apos;s events — training, matches and meetings.</p>
      </div>

      <CalendarView
        manageBasePath={null}
        feedUrl={`${baseUrl()}/api/v1/public/calendar.ics?token=${token}`}
      />
    </main>
  );
}
