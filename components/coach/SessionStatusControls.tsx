"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SessionStatusControls({ eventId, status }: { eventId: number; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function setStatus(newStatus: string) {
    setLoading(true);
    try {
      await fetch(`/api/v1/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (status === "CANCELLED") return null;

  return (
    <div className="flex gap-2">
      {status !== "COMPLETED" && (
        <button type="button" disabled={loading} onClick={() => setStatus("COMPLETED")} className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
          Mark completed
        </button>
      )}
      <button type="button" disabled={loading} onClick={() => setStatus("CANCELLED")} className="rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
        Cancel session
      </button>
    </div>
  );
}
