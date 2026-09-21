"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface PlayerOption { id: number; name: string; }
interface CategoryOption { id: number; label: string; }

export default function RecordEvaluationForm({ players }: { players: PlayerOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[] | null>(null);
  const [playerId, setPlayerId] = useState(players[0]?.id?.toString() ?? "");
  const [periodType, setPeriodType] = useState<"WEEKLY" | "MONTHLY">("WEEKLY");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [scores, setScores] = useState<Record<number, number>>({});
  const [strengths, setStrengths] = useState("");
  const [developmentAreas, setDevelopmentAreas] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || categories) return;
    fetch("/api/v1/performance-categories")
      .then((r) => r.json())
      .then((cats: CategoryOption[]) => {
        setCategories(cats);
        setScores(Object.fromEntries(cats.map((c) => [c.id, 5])));
      });
  }, [open, categories]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!categories) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: Number(playerId),
          periodType,
          periodStart,
          periodEnd,
          categoryScores: categories.map((c) => ({ categoryId: c.id, score: scores[c.id] })),
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
      <button type="button" onClick={() => setOpen(true)} className="rounded-full bg-gradient-to-r from-court-500 to-court-700 px-5 py-2.5 text-sm font-bold text-white shadow-court-500/30 transition hover:border-flame">
        + Record Evaluation
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-card border border-line bg-surface p-5 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <select value={playerId} onChange={(e) => setPlayerId(e.target.value)} className="rounded-control border border-line px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20">
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
        <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required className="rounded-control border border-line px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20" />
        <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required className="rounded-control border border-line px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {!categories ? (
          <p className="text-sm text-slate-500">Loading categories…</p>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between gap-3 rounded-control bg-slate-50 px-3 py-2">
              <label htmlFor={`cat-${category.id}`} className="text-sm font-medium text-slate-700">{category.label}</label>
              <input
                id={`cat-${category.id}`}
                type="number"
                min={1}
                max={10}
                value={scores[category.id] ?? 5}
                onChange={(e) => setScores((prev) => ({ ...prev, [category.id]: Number(e.target.value) }))}
                className="w-16 rounded-lg border border-line px-2 py-1 text-center outline-none focus:border-court-500"
              />
            </div>
          ))
        )}
      </div>
      <p className="text-xs text-slate-500">Overall score is the average of the categories above — computed automatically.</p>

      {periodType === "MONTHLY" && (
        <>
          <textarea placeholder="Strengths" value={strengths} onChange={(e) => setStrengths(e.target.value)} className="w-full rounded-control border border-line px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20" />
          <textarea placeholder="Development areas" value={developmentAreas} onChange={(e) => setDevelopmentAreas(e.target.value)} className="w-full rounded-control border border-line px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20" />
        </>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={loading || !categories} className="rounded-full bg-gradient-to-r from-court-500 to-court-700 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
          {loading ? "Saving..." : "Save evaluation"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
      </div>
    </form>
  );
}
