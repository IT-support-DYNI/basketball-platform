import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/authz/guard";
import { eventDayLabel, eventTimeRange, EVENT_TYPE_LABEL } from "@/lib/events";
import CheckInPanel from "@/components/checkin/CheckInPanel";

export default async function CheckInPage({
  params,
  searchParams,
}: {
  params: { eventId: string };
  searchParams: { t?: string };
}) {
  const session = await getServerSession(authOptions);
  const eventId = Number(params.eventId);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      teamId: true,
      type: true,
      title: true,
      startAt: true,
      endAt: true,
      arrivalTime: true,
      status: true,
      venue: { select: { name: true } },
      locationText: true,
    },
  });
  if (!event) notFound();

  const canRead =
    session?.user &&
    (event.teamId == null
      ? authorize(session).can("read", "Event", { teamId: null })
      : authorize(session).can("read", "Event", { teamId: event.teamId }));
  if (!canRead) notFound();

  const playerId = session!.user.playerId;
  const record = playerId
    ? await prisma.attendanceRecord.findUnique({
        where: { eventId_playerId: { eventId, playerId } },
        select: { status: true, checkInAt: true, checkOutAt: true },
      })
    : null;

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-5 px-4 py-10">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-wider text-flame">{EVENT_TYPE_LABEL[event.type]}</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">{event.title}</h1>
        <p className="mt-1 text-ink-dim">
          {eventDayLabel(event.startAt)} · {eventTimeRange(event.startAt, event.endAt)}
          {event.venue?.name ? ` · ${event.venue.name}` : event.locationText ? ` · ${event.locationText}` : ""}
        </p>
      </div>

      {!playerId ? (
        <p className="rounded-card border border-line bg-surface p-5 text-sm text-ink-dim">
          Only players check in to events.
        </p>
      ) : (
        <CheckInPanel
          eventId={event.id}
          tokenFromUrl={searchParams.t ?? null}
          initial={
            record
              ? {
                  status: record.status,
                  checkInAt: record.checkInAt?.toISOString() ?? null,
                  checkOutAt: record.checkOutAt?.toISOString() ?? null,
                }
              : null
          }
        />
      )}

      <Link href="/player/training" className="text-sm font-semibold text-flame-ink hover:underline">
        ← Back to schedule
      </Link>
    </main>
  );
}
