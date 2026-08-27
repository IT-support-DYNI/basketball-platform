"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = ["SHOOTING", "DEFENSE", "PASSING", "BALL_HANDLING", "FITNESS", "TEAMWORK", "EFFORT", "DISCIPLINE"] as const;

interface PlayerOption { id: number; name: string; }

export default function RecordEvaluationForm({ players }: { players: PlayerOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [playerId, setPlayerId] = useState(players[0]?.id?.toString() ?? "");
  const [periodType, setPeriodType] = useState<"WEEKLY" | "MONTHLY">("WEEKLY");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [scores, setScores] = useState<Record<string, number>>(Object.fromEntries(CATEGORIES.map((c) => [c, 5])));
  const [strengths, setStrengths] = useState("");
  const [developmentAreas, setDevelopmentAreas] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: Number(playerId),
          periodType,
          periodStart,
          periodEnd,
          categoryScores: CATEGORIES.map((category) => ({ category, score: scores[category] })),
          strengths: periodType === "MONTHLY" ? strengths || undefined : undefined,
          developmentAreas: periodType === "MONTHLY" ? developmentAreas || undefined : undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Something went wrong.");
        return;
      }

      setOpen(false);
      setPeriodStart("");
      setPeriodEnd("");
      setStrengths("");
      setDevelopmentAreas("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (players.length === 0) return null;

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-full bg-gradient-to-r from-court-500 to-court-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-court-500/30 transition hover:shadow-md">
        + Record Evaluation
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-surface p-5 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <select value={playerId} onChange={(e) => setPlayerId(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20">
          {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="flex gap-3">
          <label className="flex items-center gap-1.5 text-sm font-medium">
            <input type="radio" checked={periodType === "WEEKLY"} onChange={() => setPeriodType("WEEKLY")} /> Weekly
          </label>
          <label className="flex items-center gap-1.5 text-sm font-medium">
            <input type="radio" checked={periodType === "MONTHLY"} onChange={() => setPeriodType("MONTHLY")} /> Monthly
          </label>
        </div>
        <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20" />
        <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {CATEGORIES.map((category) => (
          <div key={category} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
            <label htmlFor={category} className="text-sm font-medium text-slate-700">{category.replace(/_/g, " ")}</label>
            <input
              id={category}
              type="number"
              min={1}
              max={10}
              value={scores[category]}
              onChange={(e) => setScores((prev) => ({ ...prev, [category]: Number(e.target.value) }))}
              className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-center outline-none focus:border-court-500"
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500">Overall score is the average of the categories above — computed automatically.</p>

      {periodType === "MONTHLY" && (
        <>
          <textarea placeholder="Strengths" value={strengths} onChange={(e) => setStrengths(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20" />
          <textarea placeholder="Development areas" value={developmentAreas} onChange={(e) => setDevelopmentAreas(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20" />
        </>
      )}

      {error && <p className="text-sm text-rose-700">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="rounded-full bg-gradient-to-r from-court-500 to-court-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-50">
          {loading ? "Saving..." : "Save evaluation"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
      </div>
    </form>
  );
}
