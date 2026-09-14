"use client";

import { useState } from "react";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Alert from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/toast";

type Season = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  members: number;
  squads: number;
};

export default function SeasonManager({ initial }: { initial: Season[] }) {
  const toast = useToast();
  const [seasons, setSeasons] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [makeActive, setMakeActive] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const s = await fetch("/api/v1/seasons").then((r) => r.json());
    setSeasons(
      s.map((x: { id: number; name: string; startDate: string; endDate: string; isActive: boolean; _count: { memberships: number; squads: number } }) => ({
        id: x.id,
        name: x.name,
        startDate: x.startDate.slice(0, 10),
        endDate: x.endDate.slice(0, 10),
        isActive: x.isActive,
        members: x._count.memberships,
        squads: x._count.squads,
      })),
    );
  }

  async function create() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/v1/seasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, startDate: start, endDate: end, isActive: makeActive }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Couldn't create the season.");
        return;
      }
      setCreating(false);
      setName("");
      setStart("");
      setEnd("");
      await refresh();
      toast({ title: "Season created", tone: "success" });
    } finally {
      setBusy(false);
    }
  }

  async function activate(id: number) {
    const res = await fetch(`/api/v1/seasons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: true }),
    });
    if (res.ok) {
      await refresh();
      toast({ title: "Active season changed", tone: "success" });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card as="section">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">All seasons</h2>
          {!creating && (
            <Button size="sm" onClick={() => setCreating(true)}>
              New season
            </Button>
          )}
        </div>

        {creating && (
          <div className="mt-3 rounded-card border border-line bg-surface-2 p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <TextField label="Name" placeholder="2026–2027" value={name} onChange={(e) => setName(e.target.value)} />
              <TextField label="Starts" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
              <TextField label="Ends" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-ink-dim">
              <input
                type="checkbox"
                checked={makeActive}
                onChange={(e) => setMakeActive(e.target.checked)}
                className="h-4 w-4 accent-flame"
              />
              Make this the active season
            </label>
            {error && <Alert tone="danger" className="mt-3">{error}</Alert>}
            <div className="mt-3 flex gap-2">
              <Button size="sm" loading={busy} onClick={create} disabled={!name || !start || !end}>
                Create
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <ul className="mt-3 divide-y divide-line">
          {seasons.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-ink">
                  {s.name}
                  {s.isActive && <Badge tone="success">Active</Badge>}
                </p>
                <p className="text-xs text-ink-faint">
                  {s.startDate} → {s.endDate} · {s.members} memberships · {s.squads} squads
                </p>
              </div>
              {!s.isActive && (
                <Button size="sm" variant="secondary" onClick={() => activate(s.id)}>
                  Make active
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
