"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";
import Alert from "@/components/ui/Alert";

export default function NewPlanForm({
  teams,
  templates,
  forEvent,
}: {
  teams: { id: number; name: string }[];
  templates: { id: number; title: string; teamId: number }[];
  forEvent?: { id: number; title: string; startAt: string; teamId: number; teamName: string } | null;
}) {
  const router = useRouter();
  const [teamId, setTeamId] = useState((forEvent?.teamId ?? teams[0]?.id)?.toString() ?? "");
  const [title, setTitle] = useState(forEvent ? forEvent.title : "");
  const [objectives, setObjectives] = useState("");
  const [date, setDate] = useState(forEvent ? forEvent.startAt.slice(0, 10) : "");
  const [fromTemplateId, setFromTemplateId] = useState("");
  const [isTemplate, setIsTemplate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const teamTemplates = templates.filter((t) => t.teamId === Number(teamId));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/v1/training-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: Number(teamId),
          title: title.trim(),
          objectives: objectives.trim() || undefined,
          date: !isTemplate && date ? new Date(date).toISOString() : undefined,
          isTemplate,
          fromTemplateId: fromTemplateId ? Number(fromTemplateId) : undefined,
          eventId: forEvent && !isTemplate ? forEvent.id : undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Couldn't create the plan.");
        return;
      }
      router.push(`/coach/training/plans/${body.id}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {error && <Alert tone="danger">{error}</Alert>}

      {forEvent && (
        <p className="rounded-control border border-flame/30 bg-flame/10 px-3 py-2 text-sm text-flame-ink">
          Planning the <strong>{forEvent.teamName}</strong> session on{" "}
          {new Date(forEvent.startAt).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}.
        </p>
      )}

      {teams.length > 1 && !forEvent && (
        <Select label="Team" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </Select>
      )}

      <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={2} placeholder="Tuesday practice — pick-and-roll" />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">Objectives</span>
        <span className="text-xs text-ink-dim">What should players leave able to do?</span>
        <textarea
          value={objectives}
          onChange={(e) => setObjectives(e.target.value)}
          rows={3}
          className="w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-flame/50"
        />
      </label>

      {!forEvent && (
        <label className="flex items-center gap-2 text-sm text-ink-dim">
          <input type="checkbox" checked={isTemplate} onChange={(e) => setIsTemplate(e.target.checked)} className="h-4 w-4 accent-flame" />
          Save this as a reusable template (no date)
        </label>
      )}

      {!isTemplate && !forEvent && (
        <TextField label="Session date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      )}

      {teamTemplates.length > 0 && (
        <Select label="Start from a template" hint="Optional — copies its blocks." value={fromTemplateId} onChange={(e) => setFromTemplateId(e.target.value)}>
          <option value="">Blank plan</option>
          {teamTemplates.map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </Select>
      )}

      <div>
        <Button type="submit" loading={busy}>Create plan</Button>
      </div>
    </form>
  );
}
