"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";

type Item = {
  id: number;
  title: string;
  body: string;
  scope: string;
  team: { id: number; name: string } | null;
  author: { name: string };
  requiresAck: boolean;
  pinned: boolean;
  createdAt: string;
  acknowledgedByMe: boolean;
  ackCount: number;
  canViewAcks: boolean;
};
type TeamOpt = { id: number; name: string };

const fieldCls = "w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm";

export default function AnnouncementsBoard({
  canPost,
  allowPlatform,
  teams,
}: {
  canPost: boolean;
  /** May the caller post a club-wide announcement? (admins only) */
  allowPlatform: boolean;
  /** Teams the caller may post to. */
  teams: TeamOpt[];
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [breakdownFor, setBreakdownFor] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<{ acknowledged: number; expected: number; people: { name: string; role: string; acknowledgedAt: string | null }[] } | null>(null);

  const load = () =>
    fetch("/api/v1/announcements")
      .then((r) => (r.ok ? r.json() : []))
      .then(setItems)
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  async function ack(id: number) {
    await fetch(`/api/v1/announcements/${id}/ack`, { method: "POST" });
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, acknowledgedByMe: true, ackCount: i.ackCount + 1 } : i)));
  }

  async function toggleBreakdown(id: number) {
    if (breakdownFor === id) return setBreakdownFor(null);
    const b = await fetch(`/api/v1/announcements/${id}/acks`).then((r) => (r.ok ? r.json() : null));
    setBreakdown(b);
    setBreakdownFor(id);
  }

  return (
    <div className="flex flex-col gap-4">
      {canPost && (
        <div>
          {composing ? (
            <ComposeForm
              teams={teams}
              allowPlatform={allowPlatform}
              onDone={() => {
                setComposing(false);
                load();
              }}
              onCancel={() => setComposing(false)}
            />
          ) : (
            <button
              onClick={() => setComposing(true)}
              className="rounded-full bg-flame px-5 py-2 text-sm font-bold text-on-flame"
            >
              + New announcement
            </button>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-ink-faint">Loading…</p>
      ) : items.length === 0 ? (
        <p className="rounded-card border border-line bg-surface p-5 text-sm text-ink-dim">Nothing posted yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((a) => (
            <li
              key={a.id}
              className={cn(
                "rounded-card border bg-surface p-5",
                a.pinned ? "border-flame/40" : "border-line",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-display font-bold text-ink">
                    {a.pinned && <span className="mr-1.5 text-flame-ink">📌</span>}
                    {a.title}
                  </p>
                  <p className="text-xs text-ink-faint">
                    {a.author.name} · {a.scope === "TEAM" ? a.team?.name ?? "Team" : "Club-wide"} ·{" "}
                    {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {a.requiresAck &&
                  (a.acknowledgedByMe ? (
                    <span className="rounded-full border border-success/40 px-2.5 py-1 text-xs font-semibold text-success">
                      Acknowledged
                    </span>
                  ) : (
                    <button
                      onClick={() => ack(a.id)}
                      className="rounded-full bg-flame px-3 py-1.5 text-xs font-bold text-on-flame"
                    >
                      I&apos;ve read this
                    </button>
                  ))}
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-dim">{a.body}</p>

              {a.canViewAcks && (
                <div className="mt-3 border-t border-line pt-2">
                  <button
                    onClick={() => toggleBreakdown(a.id)}
                    className="text-xs font-semibold text-flame-ink hover:underline"
                  >
                    {breakdownFor === a.id ? "Hide" : "Who's read it?"}
                  </button>
                  {breakdownFor === a.id && breakdown && (
                    <div className="mt-2 text-xs">
                      <p className="text-ink-dim">
                        {breakdown.acknowledged} of {breakdown.expected} acknowledged
                      </p>
                      <ul className="mt-1.5 grid gap-0.5 sm:grid-cols-2">
                        {breakdown.people.map((p, i) => (
                          <li key={i} className={cn("flex justify-between", p.acknowledgedAt ? "text-ink-dim" : "text-warning")}>
                            <span>{p.name}</span>
                            <span>{p.acknowledgedAt ? "✓" : "pending"}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  function ComposeForm({
    teams,
    allowPlatform,
    onDone,
    onCancel,
  }: {
    teams: TeamOpt[];
    allowPlatform: boolean;
    onDone: () => void;
    onCancel: () => void;
  }) {
    const [v, setV] = useState({
      title: "",
      body: "",
      scope: allowPlatform ? "PLATFORM" : "TEAM",
      teamId: teams[0]?.id?.toString() ?? "",
      requiresAck: false,
      pinned: false,
    });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    async function submit(e: React.FormEvent) {
      e.preventDefault();
      setBusy(true);
      setError("");
      try {
        const res = await fetch("/api/v1/announcements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: v.title,
            body: v.body,
            scope: v.scope,
            teamId: v.scope === "TEAM" ? Number(v.teamId) : undefined,
            requiresAck: v.requiresAck,
            pinnedUntil: v.pinned ? new Date(Date.now() + 14 * 864e5).toISOString() : undefined,
          }),
        });
        if (!res.ok) {
          setError((await res.json().catch(() => ({}))).error ?? "Couldn't post.");
          return;
        }
        onDone();
      } finally {
        setBusy(false);
      }
    }

    return (
      <form onSubmit={submit} className="space-y-3 rounded-card border border-line bg-surface p-4">
        <input required placeholder="Title" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} className={fieldCls} />
        <textarea required placeholder="Write your announcement…" rows={4} value={v.body} onChange={(e) => setV({ ...v, body: e.target.value })} className={fieldCls} />
        <div className="grid gap-3 sm:grid-cols-2">
          <select value={v.scope} onChange={(e) => setV({ ...v, scope: e.target.value })} className={fieldCls}>
            {allowPlatform && <option value="PLATFORM">Everyone (club-wide)</option>}
            {teams.length > 0 && <option value="TEAM">A team</option>}
          </select>
          {v.scope === "TEAM" && (
            <select value={v.teamId} onChange={(e) => setV({ ...v, teamId: e.target.value })} className={fieldCls}>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-ink-dim">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={v.requiresAck} onChange={(e) => setV({ ...v, requiresAck: e.target.checked })} className="h-4 w-4 accent-flame" />
            Require acknowledgement
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={v.pinned} onChange={(e) => setV({ ...v, pinned: e.target.checked })} className="h-4 w-4 accent-flame" />
            Pin for 2 weeks
          </label>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex gap-2">
          <button disabled={busy} className="rounded-full bg-flame px-5 py-2 text-sm font-bold text-on-flame disabled:opacity-50">
            {busy ? "Posting…" : "Post"}
          </button>
          <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-sm font-semibold text-ink-dim">
            Cancel
          </button>
        </div>
      </form>
    );
  }
}
