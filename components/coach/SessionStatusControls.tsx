"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SessionStatusControls({
  eventId,
  status,
  recurring = false,
}: {
  eventId: number;
  status: string;
  recurring?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmSeries, setConfirmSeries] = useState(false);

  async function setStatus(newStatus: string, scope?: "series") {
    setLoading(true);
    try {
      const qs = scope ? `?scope=${scope}` : "";
      await fetch(`/api/v1/events/${eventId}${qs}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } finally {
      setLoading(false);
      setConfirmSeries(false);
    }
  }

  if (status === "CANCELLED") return null;

  const btn = "rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50";

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "COMPLETED" && (
        <button type="button" disabled={loading} onClick={() => setStatus("COMPLETED")} className={`${btn} bg-success/10 text-success hover:bg-success/20`}>
          Mark completed
        </button>
      )}
      <button type="button" disabled={loading} onClick={() => setStatus("CANCELLED")} className={`${btn} bg-danger/10 text-danger hover:bg-danger/20`}>
        Cancel this one
      </button>
      {recurring &&
        (confirmSeries ? (
          <button type="button" disabled={loading} onClick={() => setStatus("CANCELLED", "series")} className={`${btn} bg-danger text-on-flame`}>
            Confirm — cancel all future
          </button>
        ) : (
          <button type="button" disabled={loading} onClick={() => setConfirmSeries(true)} className={`${btn} border border-line text-ink-dim hover:text-ink`}>
            Cancel this &amp; future
          </button>
        ))}
    </div>
  );
}
