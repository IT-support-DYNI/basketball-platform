"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/cn";

type Rec = {
  id: number;
  name: string;
  status: string;
  method: string;
  note: string | null;
  checkInAt: string | null;
  checkOutAt: string | null;
};

type Audit = {
  id: number;
  reason: string;
  changedAt: string;
  changedBy: { name: string };
  before: Record<string, unknown>;
  after: Record<string, unknown>;
};

const STATUSES = ["PRESENT", "LATE", "ABSENT", "EXCUSED"] as const;
const time = (s: string | null) =>
  s ? new Date(s).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—";

export default function AttendanceCorrections({ records }: { records: Rec[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [historyFor, setHistoryFor] = useState<number | null>(null);
  const [history, setHistory] = useState<Audit[]>([]);

  if (records.length === 0) {
    return <p className="text-sm text-ink-dim">No check-ins or marks yet.</p>;
  }

  function startEdit(r: Rec) {
    setEditing(r.id);
    setStatus(r.status);
    setReason("");
    setError("");
  }

  async function save(id: number) {
    if (reason.trim().length < 3) {
      setError("A short reason is required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/attendance/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason: reason.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Couldn't save the correction.");
        return;
      }
      setEditing(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function toggleHistory(id: number) {
    if (historyFor === id) {
      setHistoryFor(null);
      return;
    }
    const rows = await fetch(`/api/v1/attendance/${id}/audit`).then((r) => (r.ok ? r.json() : []));
    setHistory(rows);
    setHistoryFor(id);
  }

  return (
    <ul className="divide-y divide-line">
      {records.map((r) => (
        <li key={r.id} className="py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="font-medium text-ink">{r.name}</span>
              <span className="ml-2 rounded-full border border-line px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-dim">
                {r.status}
              </span>
              {r.method !== "COACH" && (
                <span className="ml-1 text-[10px] uppercase tracking-wide text-ink-faint">{r.method}</span>
              )}
              <span className="ml-2 text-xs text-ink-dim">
                in {time(r.checkInAt)} · out {time(r.checkOutAt)}
              </span>
            </div>
            <div className="flex gap-2 text-xs font-semibold">
              <button onClick={() => toggleHistory(r.id)} className="text-ink-faint hover:text-ink">
                History
              </button>
              <button onClick={() => startEdit(r)} className="text-flame-ink hover:underline">
                Correct
              </button>
            </div>
          </div>

          {editing === r.id && (
            <div className="mt-2 space-y-2 rounded-control border border-line bg-surface-2 p-3">
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-semibold",
                      status === s ? "border-flame/40 bg-flame/15 text-flame-ink" : "border-line text-ink-dim",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for the correction (required)"
                className="w-full rounded-control border border-line bg-surface px-3 py-2 text-sm"
              />
              {error && <p className="text-xs text-danger">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => save(r.id)}
                  disabled={busy}
                  className="rounded-full bg-flame px-4 py-1.5 text-xs font-bold text-on-flame disabled:opacity-50"
                >
                  Save
                </button>
                <button onClick={() => setEditing(null)} className="rounded-full px-4 py-1.5 text-xs font-semibold text-ink-dim">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {historyFor === r.id && (
            <div className="mt-2 rounded-control border border-line bg-surface-2 p-3 text-xs">
              {history.length === 0 ? (
                <p className="text-ink-faint">No corrections recorded.</p>
              ) : (
                <ul className="space-y-1.5">
                  {history.map((h) => (
                    <li key={h.id}>
                      <span className="text-ink-dim">
                        {new Date(h.changedAt).toLocaleString()} · {h.changedBy.name}
                      </span>
                      <span className="ml-1 text-ink">
                        {String(h.before.status)} → {String(h.after.status)}
                      </span>
                      <span className="ml-1 text-ink-faint">“{h.reason}”</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
