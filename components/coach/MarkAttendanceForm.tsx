"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const;
type Status = (typeof STATUSES)[number];

interface PlayerRow {
  id: number;
  name: string;
  currentStatus: Status | null;
}

export default function MarkAttendanceForm({ eventId, players }: { eventId: number; players: PlayerRow[] }) {
  const router = useRouter();
  const [statuses, setStatuses] = useState<Record<number, Status>>(
    Object.fromEntries(players.map((p) => [p.id, p.currentStatus ?? "PRESENT"]))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/v1/events/${eventId}/attendance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          records: players.map((p) => ({ playerId: p.id, status: statuses[p.id] })),
        }),
      });
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <ul className="divide-y divide-slate-100">
        {players.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <span className="font-medium text-slate-800">{p.name}</span>
            <div className="flex gap-1">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatuses((prev) => ({ ...prev, [p.id]: s }))}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    statuses[p.id] === s
                      ? s === "PRESENT"
                        ? "bg-emerald-600 text-white"
                        : s === "ABSENT"
                        ? "bg-rose-600 text-white"
                        : s === "LATE"
                        ? "bg-amber-500 text-white"
                        : "bg-slate-500 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </li>
        ))}
        {players.length === 0 && <p className="py-2 text-sm text-slate-500">No players on this roster.</p>}
      </ul>

      {players.length > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-gradient-to-r from-court-500 to-court-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save attendance"}
          </button>
          {saved && <span className="text-sm text-emerald-700">Saved ✓</span>}
        </div>
      )}
    </div>
  );
}
