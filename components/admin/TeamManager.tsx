"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Alert from "@/components/ui/Alert";
import StatusBadge from "@/components/StatusBadge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";

const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;
const STATUSES = ["ACTIVE", "INJURED", "SUSPENDED", "TRIALIST", "INACTIVE", "FORMER"] as const;
const STAFF_ROLES = [
  "HEAD_COACH",
  "ASSISTANT_COACH",
  "TEAM_MANAGER",
  "STATISTICIAN",
  "MEDICAL_OFFICER",
  "WELFARE_OFFICER",
] as const;

type Season = { id: number; name: string; isActive: boolean };
type RosterEntry = {
  membershipId: number;
  status: string;
  jerseyNumber: number | null;
  position: string | null;
  squad: { id: number; name: string } | null;
  player: { id: number; user: { name: string; email: string } };
};
type Squad = { id: number; name: string; ageGroup: string | null; _count: { memberships: number } };
type Staff = {
  id: number;
  role: string;
  user: { id: number; name: string; email: string };
  season: { name: string } | null;
};
type Candidate = { id: number; user: { name: string; email: string }; currentTeam: { name: string } | null };
type StaffUser = { id: number; name: string; email: string; role: string };

export default function TeamManager({ teamId, isAdmin }: { teamId: number; isAdmin: boolean }) {
  const toast = useToast();
  const [seasons, setSeasons] = useState<Season[] | null>(null);
  const [seasonId, setSeasonId] = useState<number | null>(null);
  const [roster, setRoster] = useState<RosterEntry[] | null>(null);
  const [squads, setSquads] = useState<Squad[] | null>(null);
  const [staff, setStaff] = useState<Staff[] | null>(null);

  const activeSeasonId = useMemo(() => seasons?.find((s) => s.isActive)?.id ?? null, [seasons]);
  const viewingActive = seasonId != null && seasonId === activeSeasonId;

  const loadSeasons = useCallback(async () => {
    const s: Season[] = await fetch("/api/v1/seasons").then((r) => r.json());
    setSeasons(s);
    setSeasonId((cur) => cur ?? s.find((x) => x.isActive)?.id ?? s[0]?.id ?? null);
  }, []);

  const loadSeasonData = useCallback(async () => {
    if (seasonId == null) return;
    const [r, sq, st] = await Promise.all([
      fetch(`/api/v1/teams/${teamId}/players?seasonId=${seasonId}`).then((x) => x.json()),
      fetch(`/api/v1/teams/${teamId}/squads?seasonId=${seasonId}`).then((x) => x.json()),
      fetch(`/api/v1/teams/${teamId}/staff`).then((x) => x.json()),
    ]);
    setRoster(r.roster ?? []);
    setSquads(sq.squads ?? []);
    setStaff(Array.isArray(st) ? st : []);
  }, [teamId, seasonId]);

  useEffect(() => {
    loadSeasons();
  }, [loadSeasons]);
  useEffect(() => {
    loadSeasonData();
  }, [loadSeasonData]);

  if (!seasons) return <LoadingState rows={4} label="Loading team" />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-ink-dim">
          Season
          <select
            value={seasonId ?? ""}
            onChange={(e) => setSeasonId(Number(e.target.value))}
            className="rounded-control border border-line-strong bg-surface px-2.5 py-1.5 text-sm text-ink"
          >
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.isActive ? " (active)" : ""}
              </option>
            ))}
          </select>
        </label>
        <ButtonLink
          href={`/api/v1/teams/${teamId}/roster/export?seasonId=${seasonId}`}
          variant="secondary"
          size="sm"
        >
          Export roster (CSV)
        </ButtonLink>
      </div>

      {!viewingActive && (
        <Alert tone="info">
          You&apos;re viewing a past season — this is read-only. Switch to the active season to make changes.
        </Alert>
      )}

      <RosterSection
        teamId={teamId}
        seasonId={seasonId!}
        roster={roster}
        squads={squads ?? []}
        editable={viewingActive}
        onChange={loadSeasonData}
        toast={toast}
      />

      {isAdmin && (
        <SquadsSection
          teamId={teamId}
          squads={squads}
          editable={viewingActive}
          onChange={loadSeasonData}
          toast={toast}
        />
      )}

      {isAdmin && (
        <StaffSection teamId={teamId} staff={staff} onChange={loadSeasonData} toast={toast} />
      )}
    </div>
  );
}

/* ---------------------------- Roster ---------------------------- */

function RosterSection({
  teamId,
  seasonId,
  roster,
  squads,
  editable,
  onChange,
  toast,
}: {
  teamId: number;
  seasonId: number;
  roster: RosterEntry[] | null;
  squads: Squad[];
  editable: boolean;
  onChange: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  const [adding, setAdding] = useState(false);

  if (!roster) return <LoadingState rows={4} label="Loading roster" />;

  async function patch(membershipId: number, data: Record<string, unknown>) {
    const res = await fetch(`/api/v1/memberships/${membershipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) onChange();
    else toast({ title: (await res.json()).error ?? "Couldn't save that", tone: "danger" });
  }

  async function remove(playerId: number, name: string) {
    if (!window.confirm(`Remove ${name} from this roster? Their history is kept.`)) return;
    const res = await fetch(`/api/v1/teams/${teamId}/players/${playerId}`, { method: "DELETE" });
    if (res.ok) {
      onChange();
      toast({ title: `${name} removed from the roster`, tone: "success" });
    }
  }

  const active = roster.filter((m) => m.status !== "FORMER");
  const former = roster.filter((m) => m.status === "FORMER");

  return (
    <Card as="section">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
          Roster ({active.length})
        </h2>
        {editable && !adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            Add player
          </Button>
        )}
      </div>

      {adding && (
        <AddPlayerPanel
          teamId={teamId}
          onDone={() => {
            setAdding(false);
            onChange();
          }}
          onCancel={() => setAdding(false)}
          toast={toast}
        />
      )}

      {active.length === 0 ? (
        <EmptyState title="No players yet" description="Add players to build the season roster." />
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {active.map((m) => (
            <li key={m.membershipId} className="flex flex-wrap items-center gap-3 py-3">
              <span className="w-10 font-condensed text-xl font-bold tabular text-flame-ink">
                {m.jerseyNumber ?? "–"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{m.player.user.name}</p>
                <p className="truncate text-xs text-ink-faint">{m.player.user.email}</p>
              </div>
              {editable ? (
                <>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    defaultValue={m.jerseyNumber ?? ""}
                    aria-label="Jersey number"
                    onBlur={(e) => {
                      const v = e.target.value === "" ? null : Number(e.target.value);
                      if (v !== m.jerseyNumber) patch(m.membershipId, { jerseyNumber: v });
                    }}
                    className="w-14 rounded-control border border-line-strong bg-surface px-2 py-1 text-sm text-ink"
                  />
                  <select
                    defaultValue={m.position ?? ""}
                    aria-label="Position"
                    onChange={(e) => patch(m.membershipId, { position: e.target.value || null })}
                    className="rounded-control border border-line-strong bg-surface px-2 py-1 text-sm text-ink"
                  >
                    <option value="">–</option>
                    {POSITIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <select
                    defaultValue={m.squad?.id ?? ""}
                    aria-label="Squad"
                    onChange={(e) =>
                      patch(m.membershipId, { squadId: e.target.value ? Number(e.target.value) : null })
                    }
                    className="rounded-control border border-line-strong bg-surface px-2 py-1 text-sm text-ink"
                  >
                    <option value="">No squad</option>
                    {squads.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <select
                    defaultValue={m.status}
                    aria-label="Status"
                    onChange={(e) => patch(m.membershipId, { status: e.target.value })}
                    className="rounded-control border border-line-strong bg-surface px-2 py-1 text-sm text-ink"
                  >
                    {STATUSES.filter((s) => s !== "FORMER").map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(m.player.id, m.player.user.name)}
                  >
                    Remove
                  </Button>
                </>
              ) : (
                <>
                  {m.position && <Badge>{m.position}</Badge>}
                  <StatusBadge status={m.status} />
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {former.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Former players this season ({former.length})
          </summary>
          <ul className="mt-2 divide-y divide-line">
            {former.map((m) => (
              <li key={m.membershipId} className="flex items-center justify-between py-2 text-sm text-ink-dim">
                <span>{m.player.user.name}</span>
                <StatusBadge status={m.status} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}

function AddPlayerPanel({
  teamId,
  onDone,
  onCancel,
  toast,
}: {
  teamId: number;
  onDone: () => void;
  onCancel: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState("");
  const [jersey, setJersey] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    fetch(`/api/v1/players?notOnTeam=${teamId}`)
      .then((r) => r.json())
      .then(setCandidates);
  }, [teamId]);

  async function submit() {
    setError("");
    setBusy(true);
    try {
      const res =
        mode === "existing"
          ? await fetch(`/api/v1/teams/${teamId}/roster`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                playerProfileId: Number(selectedId),
                jerseyNumber: jersey ? Number(jersey) : null,
              }),
            })
          : await fetch(`/api/v1/teams/${teamId}/players`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, email, jerseyNumber: jersey ? Number(jersey) : undefined }),
            });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Couldn't add that player.");
        return;
      }
      if (mode === "new") {
        setTempPassword(body.tempPassword);
        toast({ title: `Account created for ${email}`, tone: "success" });
      } else {
        onDone();
      }
    } finally {
      setBusy(false);
    }
  }

  if (tempPassword) {
    return (
      <Alert tone="info" className="mt-3">
        <p className="font-semibold">Account created. Relay this temporary password:</p>
        <p className="mt-1 select-all font-mono text-sm">{tempPassword}</p>
        <Button size="sm" variant="secondary" className="mt-2" onClick={onDone}>
          Done
        </Button>
      </Alert>
    );
  }

  return (
    <div className="mt-3 rounded-card border border-line bg-surface-2 p-4">
      <div className="mb-3 flex gap-1">
        <TabButton active={mode === "existing"} onClick={() => setMode("existing")}>
          Existing player
        </TabButton>
        <TabButton active={mode === "new"} onClick={() => setMode("new")}>
          New account
        </TabButton>
      </div>

      {mode === "existing" ? (
        candidates === null ? (
          <p className="text-sm text-ink-dim">Loading players…</p>
        ) : candidates.length === 0 ? (
          <p className="text-sm text-ink-dim">Every approved player is already on this roster.</p>
        ) : (
          <Select label="Player" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">Choose…</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.user.name}
                {c.currentTeam ? ` (currently ${c.currentTeam.name})` : ""}
              </option>
            ))}
          </Select>
        )
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <TextField
          label="Jersey"
          hint="Optional"
          type="number"
          min={0}
          max={99}
          value={jersey}
          onChange={(e) => setJersey(e.target.value)}
          className="w-24"
        />
        <Button
          size="sm"
          loading={busy}
          onClick={submit}
          disabled={mode === "existing" ? !selectedId : !name || !email}
        >
          Add
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      {error && <Alert tone="danger" className="mt-3">{error}</Alert>}
    </div>
  );
}

/* ---------------------------- Squads ---------------------------- */

function SquadsSection({
  teamId,
  squads,
  editable,
  onChange,
  toast,
}: {
  teamId: number;
  squads: Squad[] | null;
  editable: boolean;
  onChange: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  if (!squads) return null;

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/teams/${teamId}/squads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setName("");
        onChange();
      } else {
        toast({ title: (await res.json()).error ?? "Couldn't create squad", tone: "danger" });
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number, squadName: string) {
    if (!window.confirm(`Delete squad "${squadName}"? Members stay on the roster.`)) return;
    const res = await fetch(`/api/v1/teams/${teamId}/squads/${id}`, { method: "DELETE" });
    if (res.ok) onChange();
  }

  return (
    <Card as="section">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">Squads</h2>
      {squads.length === 0 ? (
        <p className="mt-2 text-sm text-ink-dim">
          No squads — the whole team is one roster. Add a squad to split it (e.g. A / B).
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {squads.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-ink">
                {s.name}
                <span className="ml-2 text-ink-faint">{s._count.memberships} players</span>
              </span>
              {editable && (
                <Button size="sm" variant="ghost" onClick={() => remove(s.id, s.name)}>
                  Delete
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {editable && (
        <div className="mt-3 flex items-end gap-2">
          <TextField label="New squad name" value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" />
          <Button size="sm" loading={busy} onClick={create}>
            Add
          </Button>
        </div>
      )}
    </Card>
  );
}

/* ---------------------------- Staff ---------------------------- */

function StaffSection({
  teamId,
  staff,
  onChange,
  toast,
}: {
  teamId: number;
  staff: Staff[] | null;
  onChange: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  const [users, setUsers] = useState<StaffUser[] | null>(null);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<string>("HEAD_COACH");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/v1/users")
      .then((r) => r.json())
      .then((u) => setUsers(Array.isArray(u) ? u : []));
  }, []);

  if (!staff) return null;

  async function assign() {
    if (!userId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/teams/${teamId}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(userId), role }),
      });
      if (res.ok) {
        setUserId("");
        onChange();
      } else {
        toast({ title: (await res.json()).error ?? "Couldn't assign", tone: "danger" });
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    const res = await fetch(`/api/v1/teams/${teamId}/staff/${id}`, { method: "DELETE" });
    if (res.ok) onChange();
  }

  return (
    <Card as="section">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">Staff</h2>
      {staff.length === 0 ? (
        <p className="mt-2 text-sm text-ink-dim">No staff assigned to this team yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {staff.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <p className="text-ink">
                  {s.user.name} <span className="font-mono text-[11px] text-ink-faint">{s.role.replace(/_/g, " ")}</span>
                </p>
                <p className="text-xs text-ink-faint">
                  {s.user.email}
                  {s.season ? ` · ${s.season.name}` : " · all seasons"}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => remove(s.id)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <Select label="Person" value={userId} onChange={(e) => setUserId(e.target.value)} className="max-w-xs">
          <option value="">Choose…</option>
          {(users ?? []).map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.role})
            </option>
          ))}
        </Select>
        <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
          {STAFF_ROLES.map((r) => (
            <option key={r} value={r}>
              {r.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
        <Button size="sm" loading={busy} onClick={assign}>
          Assign
        </Button>
      </div>
    </Card>
  );
}

/* ---------------------------- utils ---------------------------- */

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-control px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
        active ? "bg-flame text-on-flame" : "text-ink-dim hover:bg-surface-3"
      }`}
    >
      {children}
    </button>
  );
}
