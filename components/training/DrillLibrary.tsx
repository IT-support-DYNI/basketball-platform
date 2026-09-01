"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { cn } from "@/lib/cn";
import {
  DRILL_CATEGORIES,
  DRILL_DIFFICULTIES,
  DRILL_CATEGORY_LABEL,
  DRILL_DIFFICULTY_LABEL,
} from "@/lib/training";

export type DrillListItem = {
  id: number;
  name: string;
  category: string;
  difficulty: string;
  summary: string | null;
  durationMinutes: number | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  tags: string[];
  shared: boolean;
  archived: boolean;
};

const chip =
  "rounded-full border px-3 py-1 text-xs font-semibold transition";

export default function DrillLibrary({ drills }: { drills: DrillListItem[] }) {
  const [category, setCategory] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [q, setQ] = useState("");

  const shown = useMemo(
    () =>
      drills.filter(
        (d) =>
          !d.archived &&
          (!category || d.category === category) &&
          (!difficulty || d.difficulty === difficulty) &&
          (!q ||
            d.name.toLowerCase().includes(q.toLowerCase()) ||
            (d.summary ?? "").toLowerCase().includes(q.toLowerCase()) ||
            d.tags.some((t) => t.toLowerCase().includes(q.toLowerCase()))),
      ),
    [drills, category, difficulty, q],
  );

  const byCategory = useMemo(() => {
    const m = new Map<string, DrillListItem[]>();
    for (const d of shown) (m.get(d.category) ?? m.set(d.category, []).get(d.category)!).push(d);
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [shown]);

  // Only offer category chips that actually have drills (plus the current pick).
  const presentCategories = useMemo(() => {
    const set = new Set(drills.filter((d) => !d.archived).map((d) => d.category));
    return DRILL_CATEGORIES.filter((c) => set.has(c) || c === category);
  }, [drills, category]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search drills…"
          aria-label="Search drills"
          className="w-full max-w-sm rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-flame/50"
        />
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setCategory("")} className={cn(chip, category === "" ? "border-flame/40 bg-flame/10 text-flame-ink" : "border-line text-ink-dim hover:text-ink")}>
            All
          </button>
          {presentCategories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(category === c ? "" : c)}
              className={cn(chip, category === c ? "border-flame/40 bg-flame/10 text-flame-ink" : "border-line text-ink-dim hover:text-ink")}
            >
              {DRILL_CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DRILL_DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(difficulty === d ? "" : d)}
              className={cn(chip, difficulty === d ? "border-flame/40 bg-flame/10 text-flame-ink" : "border-line text-ink-dim hover:text-ink")}
            >
              {DRILL_DIFFICULTY_LABEL[d]}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-card border border-line bg-surface p-6 text-center text-sm text-ink-dim">
          No drills match those filters.
        </p>
      ) : (
        byCategory.map(([cat, list]) => (
          <section key={cat}>
            <h2 className="mb-2 font-mono text-[11px] uppercase tracking-wider text-ink-dim">
              {DRILL_CATEGORY_LABEL[cat as keyof typeof DRILL_CATEGORY_LABEL]} · {list.length}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/coach/drills/${d.id}`}
                    className="flex h-full flex-col rounded-card border border-line bg-surface p-4 transition hover:border-line-strong"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-ink">{d.name}</p>
                      {d.shared && (
                        <span className="flex-none rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-ink-faint">
                          Shared
                        </span>
                      )}
                    </div>
                    {d.summary && <p className="mt-1 text-sm text-ink-dim">{d.summary}</p>}
                    <p className="mt-3 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
                      {DRILL_DIFFICULTY_LABEL[d.difficulty as keyof typeof DRILL_DIFFICULTY_LABEL]}
                      {d.durationMinutes ? ` · ${d.durationMinutes} min` : ""}
                      {d.minPlayers || d.maxPlayers
                        ? ` · ${d.minPlayers ?? "?"}–${d.maxPlayers ?? "?"} players`
                        : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
