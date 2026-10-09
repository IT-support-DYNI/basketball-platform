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
  EMPTY_DIAGRAM,
  diagramHasContent,
  type CourtDiagram as CourtDiagramValue,
} from "@/lib/training";
import { PLAY_TYPE_LABEL, groupByType } from "@/lib/playbook";
import CourtDiagram from "@/app/coach/drills/_components/CourtDiagram";

type Block = {
  category: string;
  title: string;
  durationMinutes: string;
  notes: string;
  drillId: number | null;
  playId: number | null;
  courtDiagram: CourtDiagramValue | null;
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
  eventId: number | null;
  eventTitle: string | null;
  blocks: {
    category: string;
    title: string | null;
    durationMinutes: number | null;
    notes: string | null;
    drillId: number | null;
    drillName: string | null;
    playId: number | null;
    courtDiagram: CourtDiagramValue | null;
  }[];
};

type DrillOption = {
  id: number;
  name: string;
  category: string;
  durationMinutes: number | null;
  courtDiagram: CourtDiagramValue | null;
  archived?: boolean;
};
type PlayOption = { id: number; name: string; type: string; courtDiagram: CourtDiagramValue | null; archived?: boolean };
type SessionOption = { id: number; title: string; startAt: string };

const field =
  "w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-flame/50";

export default function PlanBuilder({
  plan,
  drills,
  plays,
  sessions,
}: {
  plan: PlanView;
  drills: DrillOption[];
  plays: PlayOption[];
  sessions: SessionOption[];
}) {
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
      playId: b.playId,
      // Older saves could store an empty diagram; treat it as "none" so the
      // builder shows the linked one, exactly as players see it.
      courtDiagram: diagramHasContent(b.courtDiagram) ? b.courtDiagram : null,
    })),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const drillsByCategory = useMemo(() => {
    const m = new Map<string, DrillOption[]>();
    for (const d of drills) (m.get(d.category) ?? m.set(d.category, []).get(d.category)!).push(d);
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [drills]);
  const playsByType = useMemo(() => groupByType(plays), [plays]);
  const drillById = useMemo(() => new Map(drills.map((d) => [d.id, d])), [drills]);
  const playById = useMemo(() => new Map(plays.map((p) => [p.id, p])), [plays]);

  const totalMin = planDurationMinutes(blocks.map((b) => ({ durationMinutes: Number(b.durationMinutes) || 0 })));

  const setBlock = (i: number, patch: Partial<Block>) =>
    setBlocks((bs) => bs.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  const addBlock = () =>
    setBlocks((bs) => [...bs, { category: "SKILL", title: "", durationMinutes: "", notes: "", drillId: null, playId: null, courtDiagram: null }]);
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
          playId: b.playId ?? null,
          // An untouched empty diagram isn't worth storing: the linked one shows instead.
          courtDiagram: diagramHasContent(b.courtDiagram) ? b.courtDiagram : null,
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
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-3 w-full bg-transparent font-display text-xl font-extrabold uppercase tracking-tight text-ink outline-none" />
        <label className="mt-3 block">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Objectives</span>
          <textarea value={objectives} onChange={(e) => setObjectives(e.target.value)} rows={2} className={cn(field, "mt-1")} />
        </label>
        {!plan.isTemplate && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Session date</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={cn(field, "mt-1")} />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Linked session</span>
              <select
                value={plan.eventId ?? ""}
                onChange={(e) => patch({ eventId: e.target.value ? Number(e.target.value) : null }, "Session linked")}
                className={cn(field, "mt-1")}
              >
                <option value="">Not linked to a session</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} · {new Date(s.startAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                  </option>
                ))}
              </select>
            </label>
          </div>
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
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">From the library</span>
                <select
                  value={b.playId ? `play:${b.playId}` : b.drillId ? `drill:${b.drillId}` : ""}
                  onChange={(e) => {
                    const [kind, id] = e.target.value.split(":");
                    setBlock(i, {
                      drillId: kind === "drill" ? Number(id) : null,
                      playId: kind === "play" ? Number(id) : null,
                    });
                  }}
                  className={field}
                >
                  <option value="">Nothing linked</option>
                  {playsByType.map(([type, list]) => (
                    <optgroup key={`play-${type}`} label={`Plays: ${PLAY_TYPE_LABEL[type]}`}>
                      {list.map((p) => (
                        <option key={p.id} value={`play:${p.id}`}>
                          {p.name}
                          {p.archived ? " (archived)" : ""}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  {drillsByCategory.map(([cat, list]) => (
                    <optgroup key={cat} label={`Drills: ${DRILL_CATEGORY_LABEL[cat as keyof typeof DRILL_CATEGORY_LABEL]}`}>
                      {list.map((d) => (
                        <option key={d.id} value={`drill:${d.id}`}>
                          {d.name}
                          {d.durationMinutes ? ` (${d.durationMinutes}m)` : ""}
                          {d.archived ? " (archived)" : ""}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {b.drillId && (
                  <Link href={`/coach/drills/${b.drillId}`} className="text-[11px] font-semibold text-flame-on-bg hover:underline">
                    Open drill →
                  </Link>
                )}
                {b.playId && (
                  <Link href={`/coach/plays/${b.playId}`} className="text-[11px] font-semibold text-flame-on-bg hover:underline">
                    Open play →
                  </Link>
                )}
              </label>
            </div>

            <BlockDiagram
              block={b}
              linked={b.playId ? playById.get(b.playId) ?? null : b.drillId ? drillById.get(b.drillId) ?? null : null}
              linkedKind={b.playId ? "play" : b.drillId ? "drill" : null}
              onChange={(courtDiagram) => setBlock(i, { courtDiagram })}
            />
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
                    ? "border-flame/40 bg-flame/10 text-flame-on-bg"
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

/**
 * The diagram part of a block. A block with nothing drawn of its own shows the
 * linked play's or drill's diagram (what players see too); "Customise for this
 * session" copies it onto the block to edit, and "Use the play's diagram"
 * drops the block's own copy again.
 */
function BlockDiagram({
  block,
  linked,
  linkedKind,
  onChange,
}: {
  block: Block;
  linked: { name: string; courtDiagram: CourtDiagramValue | null } | null;
  linkedKind: "play" | "drill" | null;
  onChange: (d: CourtDiagramValue | null) => void;
}) {
  const own = block.courtDiagram;
  const linkedDiagram = linked && diagramHasContent(linked.courtDiagram) ? linked.courtDiagram : null;
  const action = "text-[11px] font-semibold text-ink-dim hover:text-ink";

  if (own) {
    return (
      <div className="mt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            {linkedDiagram ? "Court diagram, customised for this session" : "Court diagram"}
          </span>
          <button type="button" onClick={() => onChange(null)} className={cn(action, !linkedDiagram && "hover:text-danger")}>
            {linkedDiagram ? `Use the ${linkedKind} diagram instead` : "Remove diagram"}
          </button>
        </div>
        <CourtDiagram value={own} onChange={(d) => onChange(d)} className="mt-1" />
      </div>
    );
  }

  if (linked && linkedDiagram) {
    return (
      <div className="mt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            Court diagram from the {linkedKind} &ldquo;{linked.name}&rdquo;
          </span>
          <button type="button" onClick={() => onChange(structuredClone(linkedDiagram))} className={action}>
            Customise for this session
          </button>
        </div>
        <CourtDiagram value={linkedDiagram} className="mt-1 max-w-md" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onChange(EMPTY_DIAGRAM)}
      className="mt-3 rounded-control border border-dashed border-line px-3 py-2 text-[11px] font-semibold text-ink-dim hover:border-line-strong hover:text-ink"
    >
      + Add court diagram
    </button>
  );
}
