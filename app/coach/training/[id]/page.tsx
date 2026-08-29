import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventDayLabel, eventTimeRange, EVENT_TYPE_LABEL } from "@/lib/events";
import { rosterPlayerFilter } from "@/lib/roster";
import StatusBadge from "@/components/StatusBadge";
import MarkAttendanceForm from "@/components/coach/MarkAttendanceForm";
import SessionStatusControls from "@/components/coach/SessionStatusControls";

export default async function CoachEventDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const eventId = Number(params.id);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      team: { select: { id: true, name: true } },
      venue: { select: { name: true, address: true } },
      attendanceRecords: true,
    },
  });
  if (!event) notFound();
  if (event.teamId != null && !session?.user.teamIds?.includes(event.teamId)) redirect("/coach/training");

  const roster = event.teamId
    ? await prisma.playerProfile.findMany({
        where: rosterPlayerFilter(event.teamId),
        include: { user: { select: { name: true } } },
        orderBy: { user: { name: "asc" } },
      })
    : [];

  const players = roster.map((p) => ({
    id: p.id,
    name: p.user.name,
    currentStatus: event.attendanceRecords.find((r) => r.playerId === p.id)?.status ?? null,
  }));

  return (
    <main>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{event.title}</h1>
            <StatusBadge status={event.status} />
          </div>
          <p className="mt-1 text-slate-600">
            {EVENT_TYPE_LABEL[event.type]} · {event.team?.name ?? "Club-wide"} · {eventDayLabel(event.startAt)} ·{" "}
            {eventTimeRange(event.startAt, event.endAt)}
            {event.venue?.name ? ` · ${event.venue.name}` : event.locationText ? ` · ${event.locationText}` : ""}
          </p>
          {event.description && <p className="mt-2 text-sm text-slate-500">{event.description}</p>}
        </div>
        <SessionStatusControls eventId={event.id} status={event.status} />
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-surface p-5">
        <h2 className="font-bold text-slate-900">Attendance</h2>
        <div className="mt-3">
          {event.teamId == null ? (
            <p className="text-sm text-slate-500">Club-wide events don&apos;t track a team roster.</p>
          ) : (
            <MarkAttendanceForm eventId={event.id} players={players} />
          )}
        </div>
      </section>
    </main>
  );
}
