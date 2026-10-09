"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";
import Alert from "@/components/ui/Alert";
import { EMPTY_DIAGRAM, diagramHasContent, type CourtDiagram } from "@/lib/training";
import { PLAY_TYPES, PLAY_TYPE_LABEL } from "@/lib/playbook";
import CourtDiagramEditor from "@/app/coach/drills/_components/CourtDiagram";

export type PlayFormValues = {
  id?: number;
  name: string;
  type: string;
  notes: string;
  courtDiagram: CourtDiagram | null;
};

const EMPTY: PlayFormValues = { name: "", type: "OFFENCE", notes: "", courtDiagram: null };

export default function PlayForm({
  initial,
  onCancel,
}: {
  initial?: Partial<PlayFormValues>;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [v, setV] = useState<PlayFormValues>({ ...EMPTY, ...initial });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof PlayFormValues>(k: K, value: PlayFormValues[K]) => setV((p) => ({ ...p, [k]: value }));
  const editing = initial?.id != null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch(editing ? `/api/v1/plays/${initial!.id}` : "/api/v1/plays", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: v.name.trim(),
          type: v.type,
          // On edit, send the empty string so clearing the notes actually clears them.
          notes: editing ? v.notes.trim() : v.notes.trim() || undefined,
          courtDiagram: diagramHasContent(v.courtDiagram) ? v.courtDiagram : null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Couldn't save the play.");
        return;
      }
      router.push(`/coach/plays/${editing ? initial!.id : body.id}`);
      router.refresh();
      onCancel?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {error && <Alert tone="danger">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <TextField
          label="Name"
          hint="What the team calls it, e.g. Horns entry"
          value={v.name}
          onChange={(e) => set("name", e.target.value)}
          required
          minLength={2}
          maxLength={120}
        />
        <Select label="Type" value={v.type} onChange={(e) => set("type", e.target.value)}>
          {PLAY_TYPES.map((t) => (
            <option key={t} value={t}>
              {PLAY_TYPE_LABEL[t]}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">Court diagram</span>
        <span className="text-xs text-ink-dim">Place players, the ball and cones, then draw the movement, passes and screens.</span>
        <CourtDiagramEditor value={v.courtDiagram ?? EMPTY_DIAGRAM} onChange={(cd: CourtDiagram) => set("courtDiagram", cd)} />
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">Notes for players</span>
        <span className="text-xs text-ink-dim">The call, each player&apos;s job, and what to read. Players and guardians see this.</span>
        <textarea
          value={v.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={5}
          maxLength={5000}
          className="w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-flame/50"
        />
      </label>

      <div className="flex gap-2">
        <Button type="submit" loading={busy}>
          {editing ? "Save changes" : "Create play"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
