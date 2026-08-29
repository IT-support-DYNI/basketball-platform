"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Record = { status: string; checkInAt: string | null; checkOutAt: string | null } | null;

export default function CheckInPanel({
  eventId,
  tokenFromUrl,
  initial,
}: {
  eventId: number;
  tokenFromUrl: string | null;
  initial: Record;
}) {
  const router = useRouter();
  const [record, setRecord] = useState<Record>(initial);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const autoTried = useRef(false);

  const checkIn = useCallback(
    async (payload: { token?: string; pin?: string }) => {
      setBusy(true);
      setError("");
      setMessage("");
      try {
        const res = await fetch(`/api/v1/events/${eventId}/checkin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(body.error ?? "Check-in failed.");
          return;
        }
        if (body.alreadyCheckedIn) {
          setMessage("You're already checked in.");
        } else {
          setMessage(body.status === "LATE" ? "Checked in — marked late." : "Checked in.");
        }
        setRecord({
          status: body.status ?? "PRESENT",
          checkInAt: body.checkInAt ?? new Date().toISOString(),
          checkOutAt: body.checkOutAt ?? null,
        });
        router.refresh();
      } finally {
        setBusy(false);
      }
    },
    [eventId, router],
  );

  useEffect(() => {
    if (tokenFromUrl && !record?.checkInAt && !autoTried.current) {
      autoTried.current = true;
      void checkIn({ token: tokenFromUrl });
    }
  }, [tokenFromUrl, record, checkIn]);

  async function checkOut() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/events/${eventId}/checkout`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Check-out failed.");
        return;
      }
      setRecord((r) => (r ? { ...r, checkOutAt: body.checkOutAt } : r));
      setMessage("Checked out.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const checkedIn = !!record?.checkInAt;
  const checkedOut = !!record?.checkOutAt;

  return (
    <div className="rounded-card border border-line bg-surface p-5">
      {checkedIn ? (
        <div className="space-y-3">
          <p className="text-sm text-ink">
            Checked in at{" "}
            <span className="font-semibold">
              {new Date(record!.checkInAt!).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </span>
            {record!.status === "LATE" && <span className="ml-2 text-warning">(late)</span>}
          </p>
          {checkedOut ? (
            <p className="text-sm text-ink-dim">
              Checked out at{" "}
              {new Date(record!.checkOutAt!).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}.
            </p>
          ) : (
            <button
              type="button"
              onClick={checkOut}
              disabled={busy}
              className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink-dim hover:text-ink disabled:opacity-50"
            >
              {busy ? "…" : "Check out"}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-ink-dim">
            Scan the QR on the check-in screen, or enter the venue PIN your coach reads out.
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-sm">
              <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink-faint">Venue PIN</span>
              <input
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                className="w-32 rounded-control border border-line bg-surface-2 px-3 py-2 text-lg tracking-[0.3em]"
                placeholder="––––"
              />
            </label>
            <button
              type="button"
              onClick={() => checkIn({ pin })}
              disabled={busy || pin.length < 4}
              className="rounded-full bg-flame px-5 py-2.5 text-sm font-bold text-on-flame disabled:opacity-50"
            >
              {busy ? "…" : "Check in"}
            </button>
          </div>
        </div>
      )}

      {message && <p className="mt-3 text-sm text-success">{message}</p>}
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}
