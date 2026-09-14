"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";

type Response = "ATTENDING" | "NOT_ATTENDING" | "UNSURE";

type RsvpData = {
  mine: { response: Response; note: string | null } | null;
  counts: { attending: number; notAttending: number; unsure: number; noResponse: number };
  capacity: { limited: boolean; full: boolean; remaining: number | null };
  window: { open: boolean; reason?: string };
  deadline: string | null;
};

const OPTIONS: { value: Response; label: string }[] = [
  { value: "ATTENDING", label: "Going" },
  { value: "NOT_ATTENDING", label: "Not going" },
  { value: "UNSURE", label: "Unsure" },
];

export default function RsvpControl({ eventId }: { eventId: number }) {
  const [data, setData] = useState<RsvpData | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let off = false;
    fetch(`/api/v1/events/${eventId}/rsvp`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !off && setData(d))
      .catch(() => !off && setData(null));
    return () => {
      off = true;
    };
  }, [eventId]);

  async function choose(response: Response) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Couldn't save your RSVP.");
        return;
      }
      const fresh = await fetch(`/api/v1/events/${eventId}/rsvp`).then((r) => r.json());
      setData(fresh);
    } finally {
      setSaving(false);
    }
  }

  if (!data) return <p className="text-xs text-ink-faint">Loading RSVP…</p>;

  const { mine, counts, capacity, window } = data;

  return (
    <div className="rounded-control border border-line bg-surface-2 p-3">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">Your RSVP</p>
        <p className="text-xs text-ink-dim">
          {counts.attending} going
          {capacity.limited && ` · ${capacity.remaining} left`}
          {counts.unsure > 0 && ` · ${counts.unsure} unsure`}
        </p>
      </div>

      {window.open ? (
        <div className="mt-2 flex gap-1.5">
          {OPTIONS.map((o) => {
            const active = mine?.response === o.value;
            const blocked = o.value === "ATTENDING" && capacity.full && !active;
            return (
              <button
                key={o.value}
                type="button"
                disabled={saving || blocked}
                onClick={() => choose(o.value)}
                className={cn(
                  "flex-1 rounded-full border px-2 py-1.5 text-xs font-semibold transition disabled:opacity-40",
                  active
                    ? "border-flame/40 bg-flame/15 text-flame-ink"
                    : "border-line text-ink-dim hover:text-ink",
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="mt-2 text-xs text-warning">{window.reason}</p>
      )}

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
