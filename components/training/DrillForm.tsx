"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";
import Alert from "@/components/ui/Alert";
import {
  DRILL_CATEGORIES,
  DRILL_DIFFICULTIES,
  DRILL_CATEGORY_LABEL,
  DRILL_DIFFICULTY_LABEL,
} from "@/lib/training";

export type DrillFormValues = {
  id?: number;
  name: string;
  category: string;
  difficulty: string;
  summary: string;
  instructions: string;
  coachingPoints: string[];
  commonMistakes: string[];
  durationMinutes: string;
  minPlayers: string;
  maxPlayers: string;
  equipment: string[];
  tags: string[];
};

const EMPTY: DrillFormValues = {
  name: "",
  category: "SHOOTING",
  difficulty: "INTERMEDIATE",
  summary: "",
  instructions: "",
  coachingPoints: [],
  commonMistakes: [],
  durationMinutes: "",
  minPlayers: "",
  maxPlayers: "",
  equipment: [],
  tags: [],
};

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
const csv = (s: string) => s.split(",").map((l) => l.trim()).filter(Boolean);

export default function DrillForm({
  initial,
  onCancel,
}: {
  initial?: Partial<DrillFormValues>;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [v, setV] = useState<DrillFormValues>({ ...EMPTY, ...initial });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof DrillFormValues>(k: K, value: DrillFormValues[K]) =>
    setV((p) => ({ ...p, [k]: value }));

  const editing = initial?.id != null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const payload = {
        name: v.name.trim(),
        category: v.category,
        difficulty: v.difficulty,
        summary: v.summary.trim() || undefined,
        instructions: v.instructions.trim() || undefined,
        coachingPoints: v.coachingPoints,
        commonMistakes: v.commonMistakes,
        durationMinutes: v.durationMinutes ? Number(v.durationMinutes) : undefined,
        minPlayers: v.minPlayers ? Number(v.minPlayers) : undefined,
        maxPlayers: v.maxPlayers ? Number(v.maxPlayers) : undefined,
        equipment: v.equipment,
        tags: v.tags,
      };
      const res = await fetch(editing ? `/api/v1/drills/${initial!.id}` : "/api/v1/drills", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Couldn't save the drill.");
        return;
      }
      router.push(`/coach/drills/${editing ? initial!.id : body.id}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {error && <Alert tone="danger">{error}</Alert>}

      <TextField label="Name" value={v.name} onChange={(e) => set("name", e.target.value)} required minLength={2} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Category" value={v.category} onChange={(e) => set("category", e.target.value)}>
          {DRILL_CATEGORIES.map((c) => (
            <option key={c} value={c}>{DRILL_CATEGORY_LABEL[c]}</option>
          ))}
        </Select>
        <Select label="Difficulty" value={v.difficulty} onChange={(e) => set("difficulty", e.target.value)}>
          {DRILL_DIFFICULTIES.map((d) => (
            <option key={d} value={d}>{DRILL_DIFFICULTY_LABEL[d]}</option>
          ))}
        </Select>
      </div>

      <TextField
        label="One-line summary"
        hint="Shown in the library list."
        value={v.summary}
        onChange={(e) => set("summary", e.target.value)}
        maxLength={200}
      />

      <Field label="How to run it">
        <textarea
          value={v.instructions}
          onChange={(e) => set("instructions", e.target.value)}
          rows={5}
          className={textarea}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Coaching points" hint="One per line.">
          <textarea
            defaultValue={v.coachingPoints.join("\n")}
            onChange={(e) => set("coachingPoints", lines(e.target.value))}
            rows={3}
            className={textarea}
          />
        </Field>
        <Field label="Common mistakes" hint="One per line.">
          <textarea
            defaultValue={v.commonMistakes.join("\n")}
            onChange={(e) => set("commonMistakes", lines(e.target.value))}
            rows={3}
            className={textarea}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="Duration (min)" type="number" min={1} max={180} value={v.durationMinutes} onChange={(e) => set("durationMinutes", e.target.value)} />
        <TextField label="Min players" type="number" min={1} max={30} value={v.minPlayers} onChange={(e) => set("minPlayers", e.target.value)} />
        <TextField label="Max players" type="number" min={1} max={30} value={v.maxPlayers} onChange={(e) => set("maxPlayers", e.target.value)} />
      </div>

      <TextField
        label="Equipment"
        hint="Comma-separated, e.g. cones, 4 balls, pinnies"
        defaultValue={v.equipment.join(", ")}
        onChange={(e) => set("equipment", csv(e.target.value))}
      />
      <TextField
        label="Tags"
        hint="Comma-separated — helps you find it later."
        defaultValue={v.tags.join(", ")}
        onChange={(e) => set("tags", csv(e.target.value))}
      />

      <div className="flex gap-2">
        <Button type="submit" loading={busy}>{editing ? "Save changes" : "Add drill"}</Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </form>
  );
}

const textarea =
  "w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-flame/50";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {hint && <span className="text-xs text-ink-dim">{hint}</span>}
      {children}
    </label>
  );
}
