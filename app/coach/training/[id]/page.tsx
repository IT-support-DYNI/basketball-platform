import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventDayLabel, eventTimeRange, EVENT_TYPE_LABEL } from "@/lib/events";
import { describeRule } from "@/lib/recurrence";
import { rosterPlayerFilter } from "@/lib/roster";
import { RSVP_LABEL, tallyResponses } from "@/lib/rsvp";
import StatusBadge from "@/components/StatusBadge";
import MarkAttendanceForm from "@/components/coach/MarkAttendanceForm";
import AttendanceCorrections from "@/components/coach/AttendanceCorrections";
import SessionStatusControls from "@/components/coach/SessionStatusControls";

export default async function CoachEventDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const eventId = Number(params.id);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      team: { select: { id: true, name: true } },
      venue: { select: { name: true, address: true } },
      recurrence: true,
      attendanceRecords: true,
      availabilityResponses: {
        select: { response: true, note: true, user: { select: { name: true } } },
        orderBy: { user: { name: "asc" } },
      },
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

  const nameById = new Map(roster.map((p) => [p.id, p.user.name]));
  const players = roster.map((p) => ({
    id: p.id,
    name: p.user.name,
    currentStatus: event.attendanceRecords.find((r) => r.playerId === p.id)?.status ?? null,
  }));

  const register = event.attendanceRecords
    .map((r) => ({
      id: r.id,
      name: nameById.get(r.playerId) ?? "Unknown",
      status: r.status,
      method: r.method,
      note: r.note,
      checkInAt: r.checkInAt?.toISOString() ?? null,
      checkOutAt: r.checkOutAt?.toISOString() ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const rsvps = event.availabilityResponses;
  const rsvpCounts = tallyResponses(rsvps, roster.length);
  const rsvpGroups = {
    ATTENDING: rsvps.filter((r) => r.response === "ATTENDING"),
    UNSURE: rsvps.filter((r) => r.response === "UNSURE"),
    NOT_ATTENDING: rsvps.filter((r) => r.response === "NOT_ATTENDING"),
  } as const;

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
          {event.recurrence && (
            <p className="mt-1 text-xs text-flame-ink">{describeRule({
              frequency: event.recurrence.frequency,
              interval: event.recurrence.interval,
              byWeekday: event.recurrence.byWeekday,
              until: event.recurrence.until,
              count: event.recurrence.count,
            })}</p>
          )}
          {event.description && <p className="mt-2 text-sm text-slate-500">{event.description}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <SessionStatusControls eventId={event.id} status={event.status} recurring={event.recurrenceId != null} />
          {event.teamId != null && (
            <Link
              href={`/coach/training/${event.id}/checkin`}
              className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink-dim hover:text-ink"
            >
              Open check-in screen →
            </Link>
          )}
        </div>
      </div>

      {event.teamId != null && (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold text-slate-900">RSVPs</h2>
            <p className="text-sm text-slate-500">
              {rsvpCounts.attending} going · {rsvpCounts.unsure} unsure · {rsvpCounts.notAttending} not going ·{" "}
              {rsvpCounts.noResponse} no response
              {event.capacity != null && ` · capacity ${event.capacity}`}
            </p>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {(["ATTENDING", "UNSURE", "NOT_ATTENDING"] as const).map((k) => (
              <div key={k} className="rounded-xl border border-slate-200 p-3">
                <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400">{RSVP_LABEL[k]}</p>
                <ul className="mt-1.5 space-y-0.5 text-sm text-slate-700">
                  {rsvpGroups[k].map((r, i) => (
                    <li key={i}>
                      {r.user.name}
                      {r.note ? <span className="text-slate-400"> — {r.note}</span> : null}
                    </li>
                  ))}
                  {rsvpGroups[k].length === 0 && <li className="text-slate-400">—</li>}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

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

      {event.teamId != null && register.length > 0 && (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-surface p-5">
          <h2 className="font-bold text-slate-900">Register &amp; corrections</h2>
          <p className="mt-1 text-sm text-slate-500">
            Check-in times and method. Every correction records a reason.
          </p>
          <div className="mt-3">
            <AttendanceCorrections records={register} />
          </div>
        </section>
      )}
    </main>
  );
}
