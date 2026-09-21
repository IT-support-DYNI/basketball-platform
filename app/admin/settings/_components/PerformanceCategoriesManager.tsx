"use client";

import { FormEvent, useEffect, useState } from "react";

type Category = { id: number; key: string; label: string; sortOrder: number; isActive: boolean };

/** Platform-wide settings > Performance categories — the categories coaches
 *  score players on (used to be a fixed enum; see the migration
 *  20260921120100_configurable_performance_categories). Reorder swaps the
 *  two rows' sortOrder; retiring keeps the row (past evaluations still
 *  reference it) instead of deleting it. */
export default function PerformanceCategoriesManager() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  async function load() {
    const res = await fetch("/api/v1/performance-categories?all=1");
    setCategories(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function patch(id: number, data: Partial<Pick<Category, "label" | "sortOrder" | "isActive">>) {
    setError("");
    setBusyId(id);
    try {
      const res = await fetch(`/api/v1/performance-categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Couldn't update that category.");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    if (!categories) return;
    const current = categories[index];
    const other = categories[index + direction];
    if (!other) return;
    await Promise.all([
      patch(current.id, { sortOrder: other.sortOrder }),
      patch(other.id, { sortOrder: current.sortOrder }),
    ]);
  }

  async function rename(cat: Category) {
    const next = window.prompt("Rename category", cat.label);
    if (!next || !next.trim() || next.trim() === cat.label) return;
    await patch(cat.id, { label: next.trim() });
  }

  async function addCategory(e: FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setError("");
    setAdding(true);
    try {
      const res = await fetch("/api/v1/performance-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel.trim() }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Couldn't add that category.");
        return;
      }
      setNewLabel("");
      await load();
    } finally {
      setAdding(false);
    }
  }

  if (!categories) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div>
      <ul className="divide-y divide-slate-100">
        {categories.map((c, i) => (
          <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="flex items-center gap-3">
              <div className="flex flex-col leading-none">
                <button
                  type="button"
                  disabled={i === 0 || busyId !== null}
                  onClick={() => move(i, -1)}
                  aria-label={`Move ${c.label} up`}
                  className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  type="button"
                  disabled={i === categories.length - 1 || busyId !== null}
                  onClick={() => move(i, 1)}
                  aria-label={`Move ${c.label} down`}
                  className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
              <span className={`text-sm font-medium ${c.isActive ? "text-slate-800" : "text-slate-400 line-through"}`}>
                {c.label}
              </span>
              {!c.isActive && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">Retired</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => rename(c)}
                disabled={busyId === c.id}
                className="text-xs font-semibold text-court-700 hover:underline disabled:opacity-50"
              >
                Rename
              </button>
              <button
                type="button"
                onClick={() => patch(c.id, { isActive: !c.isActive })}
                disabled={busyId === c.id}
                className="text-xs font-semibold text-slate-600 hover:underline disabled:opacity-50"
              >
                {c.isActive ? "Retire" : "Reactivate"}
              </button>
            </div>
          </li>
        ))}
        {categories.length === 0 && <p className="py-2 text-sm text-slate-500">No categories yet.</p>}
      </ul>

      <form onSubmit={addCategory} className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder="New category (e.g. Rebounding)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          className="flex-1 rounded-control border border-line px-3 py-2 text-sm outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20"
        />
        <button
          type="submit"
          disabled={adding}
          className="rounded-full bg-gradient-to-r from-court-500 to-court-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
