import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventDayLabel, eventTimeRange } from "@/lib/events";
import QrScreen from "@/components/checkin/QrScreen";

export default async function CheckInScreenPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const eventId = Number(params.id);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, teamId: true, title: true, startAt: true, endAt: true, venue: { select: { name: true } } },
  });
  if (!event) notFound();
  if (event.teamId == null || !session?.user.teamIds?.includes(event.teamId)) redirect("/coach/training");

  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">Check-in screen</h1>
          <p className="mt-1 text-ink-dim">
            {event.title} · {eventDayLabel(event.startAt)} · {eventTimeRange(event.startAt, event.endAt)}
            {event.venue?.name ? ` · ${event.venue.name}` : ""}
          </p>
        </div>
        <Link href={`/coach/training/${event.id}`} className="text-sm font-semibold text-flame-ink hover:underline">
          ← Back to event
        </Link>
      </div>

      <QrScreen eventId={event.id} eventTitle={event.title} />
    </main>
  );
}
