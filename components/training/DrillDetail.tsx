"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast";
import {
  DRILL_CATEGORY_LABEL,
  DRILL_DIFFICULTY_LABEL,
  diagramHasContent,
  type CourtDiagram,
} from "@/lib/training";
import DrillForm, { type DrillFormValues } from "./DrillForm";
import CourtDiagramView from "./CourtDiagram";

export type DrillView = {
  id: number;
  name: string;
  category: string;
  difficulty: string;
  summary: string | null;
  instructions: string | null;
  coachingPoints: string[];
  commonMistakes: string[];
  durationMinutes: number | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  equipment: string[];
  tags: string[];
  courtDiagram: CourtDiagram | null;
  shared: boolean;
  archived: boolean;
  createdByName: string | null;
  canDelete: boolean;
};

export default function DrillDetail({ drill }: { drill: DrillView }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function setArchived(archived: boolean) {
    setBusy(true);
    const res = await fetch(`/api/v1/drills/${drill.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived }),
    });
    setBusy(false);
    if (res.ok) {
      toast({ title: archived ? "Drill archived" : "Drill restored", tone: archived ? "warning" : "success" });
      router.refresh();
    } else {
      toast({ title: "Couldn't update the drill", tone: "danger" });
    }
  }

  async function remove() {
    if (!window.confirm(`Delete "${drill.name}"? This can't be undone.`)) return;
    setBusy(true);
    const res = await fetch(`/api/v1/drills/${drill.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      router.push("/coach/drills");
      router.refresh();
    } else {
      const b = await res.json().catch(() => ({}));
      toast({ title: b.error ?? "Couldn't delete the drill", tone: "danger" });
    }
  }

  if (editing) {
    const initial: Partial<DrillFormValues> = {
      id: drill.id,
      name: drill.name,
      category: drill.category,
      difficulty: drill.difficulty,
      summary: drill.summary ?? "",
      instructions: drill.instructions ?? "",
      coachingPoints: drill.coachingPoints,
      commonMistakes: drill.commonMistakes,
      durationMinutes: drill.durationMinutes?.toString() ?? "",
      minPlayers: drill.minPlayers?.toString() ?? "",
      maxPlayers: drill.maxPlayers?.toString() ?? "",
      equipment: drill.equipment,
      tags: drill.tags,
      courtDiagram: drill.courtDiagram,
    };
    return (
      <Card as="section">
        <DrillForm initial={initial} onCancel={() => setEditing(false)} />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Card as="section">
        <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
          {DRILL_CATEGORY_LABEL[drill.category as keyof typeof DRILL_CATEGORY_LABEL]} ·{" "}
          {DRILL_DIFFICULTY_LABEL[drill.difficulty as keyof typeof DRILL_DIFFICULTY_LABEL]}
          {drill.durationMinutes ? ` · ${drill.durationMinutes} min` : ""}
          {drill.minPlayers || drill.maxPlayers ? ` · ${drill.minPlayers ?? "?"}–${drill.maxPlayers ?? "?"} players` : ""}
          {drill.archived ? " · Archived" : ""}
        </p>
        {drill.summary && <p className="mt-2 text-ink-dim">{drill.summary}</p>}

        {drill.instructions && (
          <div className="mt-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">How to run it</h2>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-dim">{drill.instructions}</p>
          </div>
        )}

        {diagramHasContent(drill.courtDiagram) && (
          <div className="mt-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">Court setup</h2>
            <div className="mt-2">
              <CourtDiagramView value={drill.courtDiagram} />
            </div>
          </div>
        )}

        {drill.coachingPoints.length > 0 && (
          <List title="Coaching points" items={drill.coachingPoints} />
        )}
        {drill.commonMistakes.length > 0 && (
          <List title="Common mistakes" items={drill.commonMistakes} />
        )}

        {(drill.equipment.length > 0 || drill.tags.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {drill.equipment.map((e) => (
              <span key={e} className="rounded-full border border-line px-2.5 py-1 text-xs text-ink-dim">{e}</span>
            ))}
            {drill.tags.map((t) => (
              <span key={t} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-ink-faint">#{t}</span>
            ))}
          </div>
        )}

        {drill.createdByName && (
          <p className="mt-4 text-xs text-ink-faint">Added by {drill.createdByName}</p>
        )}
        {drill.shared && (
          <p className="mt-1 text-xs text-ink-faint">Part of the shared drill set — edits affect every club.</p>
        )}
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
        {drill.archived ? (
          <Button variant="ghost" disabled={busy} onClick={() => setArchived(false)}>Restore</Button>
        ) : (
          <Button variant="ghost" disabled={busy} onClick={() => setArchived(true)}>Archive</Button>
        )}
        {drill.canDelete && (
          <Button variant="ghost" disabled={busy} onClick={remove}>Delete</Button>
        )}
        <Link href="/coach/drills" className="self-center text-sm font-semibold text-ink-dim hover:text-ink">
          ← All drills
        </Link>
      </div>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-4">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">{title}</h2>
      <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-ink-dim">
        {items.map((i, idx) => (
          <li key={idx}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
