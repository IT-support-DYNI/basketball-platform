"use client";

import { useEffect, useState } from "react";
import qrcode from "qrcode-generator";

type Qr = { token: string; checkinUrl: string; venuePin: string | null; expiresAt: string };
type Attendee = {
  id: number;
  status: string;
  checkInAt: string | null;
  player: { user: { name: string } };
};

function qrSvg(text: string): string {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ scalable: true, margin: 2 });
}

export default function QrScreen({ eventId, eventTitle }: { eventId: number; eventTitle: string }) {
  const [qr, setQr] = useState<Qr | null>(null);
  const [checkedIn, setCheckedIn] = useState<Attendee[]>([]);

  useEffect(() => {
    let stop = false;
    const pull = () =>
      fetch(`/api/v1/events/${eventId}/qr`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => !stop && d && setQr(d))
        .catch(() => {});
    pull();
    const t = setInterval(pull, 20_000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [eventId]);

  useEffect(() => {
    let stop = false;
    const pull = () =>
      fetch(`/api/v1/events/${eventId}/attendance`)
        .then((r) => (r.ok ? r.json() : []))
        .then((rows: Attendee[]) => !stop && setCheckedIn(rows.filter((r) => r.checkInAt)))
        .catch(() => {});
    pull();
    const t = setInterval(pull, 15_000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [eventId]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col items-center rounded-card border border-line bg-surface p-6 text-center">
        <p className="font-display text-lg font-bold uppercase tracking-tight text-ink">{eventTitle}</p>
        <p className="mt-1 text-sm text-ink-dim">Scan to check in</p>
        <div
          className="mt-5 aspect-square w-full max-w-sm rounded-xl bg-white p-3 [&_svg]:h-full [&_svg]:w-full"
          // our own generated SVG string — safe
          dangerouslySetInnerHTML={{ __html: qr ? qrSvg(qr.checkinUrl) : "" }}
        />
        {qr?.venuePin && (
          <p className="mt-5 text-ink-dim">
            No phone? PIN{" "}
            <span className="font-mono text-3xl font-bold tracking-[0.3em] text-flame-ink">{qr.venuePin}</span>
          </p>
        )}
        <p className="mt-3 text-xs text-ink-faint">Code refreshes automatically.</p>
      </div>

      <div className="rounded-card border border-line bg-surface p-5">
        <p className="font-display text-sm font-bold uppercase tracking-wide text-ink">
          Checked in ({checkedIn.length})
        </p>
        <ul className="mt-3 space-y-1.5 text-sm">
          {checkedIn.map((a) => (
            <li key={a.id} className="flex items-center justify-between">
              <span className="text-ink">{a.player.user.name}</span>
              <span className="tabular text-xs text-ink-dim">
                {a.checkInAt &&
                  new Date(a.checkInAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                {a.status === "LATE" && <span className="ml-1 text-warning">late</span>}
              </span>
            </li>
          ))}
          {checkedIn.length === 0 && <li className="text-ink-faint">No one yet.</li>}
        </ul>
      </div>
    </div>
  );
}
