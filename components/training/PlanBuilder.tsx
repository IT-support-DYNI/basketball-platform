"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import Alert from "@/components/ui/Alert";
import { useToast } from "@/components/ui/toast";
import {
  TRAINING_BLOCK_CATEGORIES,
  TRAINING_BLOCK_CATEGORY_LABEL,
  TRAINING_PLAN_STATUS_LABEL,
  DRILL_CATEGORY_LABEL,
  planDurationMinutes,
} from "@/lib/training";

type Block = {
  category: string;
  title: string;
  durationMinutes: string;
  notes: string;
  drillId: number | null;
};

export type PlanView = {
  id: number;
  teamName: string;
  title: string;
  objectives: string | null;
  date: string | null;
  status: string;
  isTemplate: boolean;
  coachingNotes: string | null;
  effectivenessRating: number | null;
  postSessionNotes: string | null;
  eventTitle: string | null;
  blocks: {
    category: string;
    title: string | null;
    durationMinutes: number | null;
    notes: string | null;
    drillId: number | null;
    drillName: string | null;
  }[];
};

type DrillOption = { id: number; name: string; category: string; durationMinutes: number | null };

const field =
  "w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-flame/50";

export default function PlanBuilder({ plan, drills }: { plan: PlanView; drills: DrillOption[] }) {
  const router = useRouter();
  const toast = useToast();

  const [title, setTitle] = useState(plan.title);
  const [objectives, setObjectives] = useState(plan.objectives ?? "");
  const [date, setDate] = useState(plan.date ? plan.date.slice(0, 10) : "");
  const [coachingNotes, setCoachingNotes] = useState(plan.coachingNotes ?? "");
  const [blocks, setBlocks] = useState<Block[]>(
    plan.blocks.map((b) => ({
      category: b.category,
      title: b.title ?? "",
      durationMinutes: b.durationMinutes?.toString() ?? "",
      notes: b.notes ?? "",
      drillId: b.drillId,
    })),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const drillsByCategory = useMemo(() => {
    const m = new Map<string, DrillOption[]>();
    for (const d of drills) (m.get(d.category) ?? m.set(d.category, []).get(d.category)!).push(d);
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [drills]);

  const totalMin = planDurationMinutes(blocks.map((b) => ({ durationMinutes: Number(b.durationMinutes) || 0 })));

  const setBlock = (i: number, patch: Partial<Block>) =>
    setBlocks((bs) => bs.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  const addBlock = () =>
    setBlocks((bs) => [...bs, { category: "SKILL", title: "", durationMinutes: "", notes: "", drillId: null }]);
  const removeBlock = (i: number) => setBlocks((bs) => bs.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) =>
    setBlocks((bs) => {
      const j = i + dir;
      if (j < 0 || j >= bs.length) return bs;
      const copy = [...bs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  async function patch(body: Record<string, unknown>, okMsg?: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/training-plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error ?? "Couldn't save.");
        return false;
      }
      if (okMsg) toast({ title: okMsg, tone: "success" });
      router.refresh();
      return true;
    } finally {
      setBusy(false);
    }
  }

  const save = () =>
    patch(
      {
        title: title.trim(),
        objectives: objectives.trim() || null,
        date: plan.isTemplate ? null : date ? new Date(date).toISOString() : null,
        coachingNotes: coachingNotes.trim() || null,
        blocks: blocks.map((b) => ({
          category: b.category,
          title: b.title.trim() || undefined,
          durationMinutes: b.durationMinutes ? Number(b.durationMinutes) : undefined,
          notes: b.notes.trim() || undefined,
          drillId: b.drillId ?? null,
        })),
      },
      "Plan saved",
    );

  async function remove() {
    if (!window.confirm(`Delete "${plan.title}"?`)) return;
    const res = await fetch(`/api/v1/training-plans/${plan.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/coach/training/plans");
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <Alert tone="danger">{error}</Alert>}

      {/* header */}
      <div className="rounded-card border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-ink-dim">
            {plan.isTemplate ? "Template" : TRAINING_PLAN_STATUS_LABEL[plan.status as keyof typeof TRAINING_PLAN_STATUS_LABEL]}
          </span>
          <span className="text-xs text-ink-faint">{plan.teamName}</span>
          {plan.eventTitle && <span className="text-xs text-ink-faint">· linked to {plan.eventTitle}</span>}
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-3 w-full bg-transparent font-display text-xl font-extrabold uppercase tracking-tight text-ink outline-none" />
        <label className="mt-3 block">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Objectives</span>
          <textarea value={objectives} onChange={(e) => setObjectives(e.target.value)} rows={2} className={cn(field, "mt-1")} />
        </label>
        {!plan.isTemplate && (
          <label className="mt-3 block max-w-xs">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Session date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={cn(field, "mt-1")} />
          </label>
        )}
      </div>

      {/* blocks */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
            Session blocks
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
            {blocks.length} blocks · {totalMin} min total
          </span>
        </div>

        {blocks.map((b, i) => (
          <div key={i} className="rounded-card border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-ink-faint">{i + 1}</span>
              <select value={b.category} onChange={(e) => setBlock(i, { category: e.target.value })} className="rounded-control border border-line bg-surface-2 px-2 py-1 text-sm text-ink">
                {TRAINING_BLOCK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{TRAINING_BLOCK_CATEGORY_LABEL[c]}</option>
                ))}
              </select>
              <input
                value={b.title}
                onChange={(e) => setBlock(i, { title: e.target.value })}
                placeholder="Block title (optional)"
                className="min-w-0 flex-1 rounded-control border border-line bg-surface-2 px-2 py-1 text-sm text-ink"
              />
              <input
                type="number"
                min={1}
                max={180}
                value={b.durationMinutes}
                onChange={(e) => setBlock(i, { durationMinutes: e.target.value })}
                placeholder="min"
                aria-label={`Block ${i + 1} duration in minutes`}
                className="w-16 rounded-control border border-line bg-surface-2 px-2 py-1 text-sm text-ink"
              />
              <div className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded px-1.5 text-ink-dim hover:text-ink disabled:opacity-30" aria-label="Move up">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === blocks.length - 1} className="rounded px-1.5 text-ink-dim hover:text-ink disabled:opacity-30" aria-label="Move down">↓</button>
                <button type="button" onClick={() => removeBlock(i)} className="rounded px-1.5 text-ink-dim hover:text-danger" aria-label="Remove block">✕</button>
              </div>
            </div>

            <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_16rem]">
              <textarea
                value={b.notes}
                onChange={(e) => setBlock(i, { notes: e.target.value })}
                rows={2}
                placeholder="Setup, coaching focus, groups…"
                className={field}
              />
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Drill from library</span>
                <select
                  value={b.drillId ?? ""}
                  onChange={(e) => setBlock(i, { drillId: e.target.value ? Number(e.target.value) : null })}
                  className={field}
                >
                  <option value="">None</option>
                  {drillsByCategory.map(([cat, list]) => (
                    <optgroup key={cat} label={DRILL_CATEGORY_LABEL[cat as keyof typeof DRILL_CATEGORY_LABEL]}>
                      {list.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}{d.durationMinutes ? ` (${d.durationMinutes}m)` : ""}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {b.drillId && (
                  <Link href={`/coach/drills/${b.drillId}`} className="text-[11px] font-semibold text-flame-ink hover:underline">
                    Open drill →
                  </Link>
                )}
              </label>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addBlock}
          className="rounded-card border border-dashed border-line py-3 text-sm font-semibold text-ink-dim hover:border-line-strong hover:text-ink"
        >
          + Add block
        </button>
      </div>

      {/* coaching notes + post-session */}
      <label className="flex flex-col gap-1.5">
        <span className="font-display text-sm font-bold uppercase tracking-wide text-ink">Coaching notes</span>
        <textarea value={coachingNotes} onChange={(e) => setCoachingNotes(e.target.value)} rows={3} className={field} />
      </label>

      {plan.status === "COMPLETED" && (
        <div className="rounded-card border border-line bg-surface p-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">After the session</h2>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-ink-dim">How did it go?</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => patch({ effectivenessRating: n })}
                className={cn(
                  "h-8 w-8 rounded-full border text-sm font-bold",
                  (plan.effectivenessRating ?? 0) >= n
                    ? "border-flame/40 bg-flame/10 text-flame-ink"
                    : "border-line text-ink-faint",
                )}
                aria-label={`${n} out of 5`}
              >
                {n}
              </button>
            ))}
          </div>
          <textarea
            defaultValue={plan.postSessionNotes ?? ""}
            onBlur={(e) => patch({ postSessionNotes: e.target.value.trim() || null })}
            rows={3}
            placeholder="What worked, what to change next time…"
            className={cn(field, "mt-3")}
          />
        </div>
      )}

      {/* actions */}
      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <Button loading={busy} onClick={save}>Save plan</Button>
        {!plan.isTemplate && plan.status === "DRAFT" && (
          <Button variant="secondary" disabled={busy} onClick={() => patch({ status: "PUBLISHED" }, "Published to the team")}>
            Publish to team
          </Button>
        )}
        {!plan.isTemplate && plan.status === "PUBLISHED" && (
          <Button variant="secondary" disabled={busy} onClick={() => patch({ status: "COMPLETED" }, "Marked completed")}>
            Mark completed
          </Button>
        )}
        {!plan.isTemplate && plan.status === "COMPLETED" && (
          <Button variant="ghost" disabled={busy} onClick={() => patch({ status: "PUBLISHED" })}>
            Reopen
          </Button>
        )}
        <Button variant="ghost" disabled={busy} onClick={remove}>Delete</Button>
        <Link href="/coach/training/plans" className="self-center text-sm font-semibold text-ink-dim hover:text-ink">
          ← All plans
        </Link>
      </div>
    </div>
  );
}
