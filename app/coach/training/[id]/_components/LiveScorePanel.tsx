"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { periodLabel, type LiveStatus } from "@/lib/live-score-labels";

type Score = {
  opponentName: string | null;
  ourScore: number;
  opponentScore: number;
  liveStatus: LiveStatus;
  period: number | null;
};

/**
 * Courtside scoring for a match: big tap targets (it's used on a phone at the
 * side of the court), every tap saved straight away. Taps are sent as
 * increments and applied atomically on the server, so quick taps can't
 * overwrite each other; the panel shows the server's totals once every
 * in-flight save has answered. The public homepage polls the same data, so a
 * basket shows there within about half a minute, for Public matches only.
 */
export default function LiveScorePanel({
  eventId,
  teamName,
  isPublic,
  initial,
}: {
  eventId: number;
  teamName: string;
  isPublic: boolean;
  initial: Score;
}) {
  const router = useRouter();
  const [score, setScore] = useState<Score>(initial);
  const [opponent, setOpponent] = useState(initial.opponentName ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Saves still waiting for an answer. Server totals are only applied when
  // this reaches 0, so an older response can't overwrite a newer tap.
  const inFlight = useRef(0);

  /**
   * `apply` updates the screen straight away; `undo` reverses just this change
   * if the save fails, leaving any other taps that did save untouched.
   */
  async function save(patch: Record<string, unknown>, apply: (s: Score) => Score, undo: (s: Score) => Score) {
    setScore(apply);
    inFlight.current += 1;
    setBusy(true);
    setError("");
    let failed = false;
    let saved: Score | null = null;
    try {
      const res = await fetch(`/api/v1/events/${eventId}/score`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        failed = true;
        setError(body.error ?? "Couldn't save the score.");
      } else {
        saved = {
          opponentName: body.opponentName ?? null,
          ourScore: body.ourScore ?? 0,
          opponentScore: body.opponentScore ?? 0,
          liveStatus: body.liveStatus ?? "UPCOMING",
          period: body.period ?? null,
        };
      }
    } catch {
      failed = true;
      setError("Couldn't reach the server. Check your connection and tap again.");
    } finally {
      inFlight.current -= 1;
      if (failed) setScore(undo);
      if (inFlight.current === 0) {
        setBusy(false);
        if (saved) setScore(saved);
      }
      if (saved?.liveStatus === "FINAL" && patch.liveStatus === "FINAL") router.refresh();
    }
  }

  /** Set some fields; on failure put back what they were (other fields untouched). */
  const saveFields = (patch: Partial<Score>) => {
    const before = Object.fromEntries(Object.keys(patch).map((k) => [k, score[k as keyof Score]])) as Partial<Score>;
    return save(patch, (s) => ({ ...s, ...patch }), (s) => ({ ...s, ...before }));
  };

  const bump = (side: "ourScore" | "opponentScore", by: number) => {
    if (score[side] + by < 0) return;
    const starting = score.liveStatus === "UPCOMING";
    save(
      { [side === "ourScore" ? "addOur" : "addOpponent"]: by },
      (s) => ({ ...s, [side]: Math.max(0, s[side] + by), ...(starting ? { liveStatus: "LIVE", period: 1 } : {}) }),
      (s) => ({ ...s, [side]: Math.max(0, s[side] - by) }),
    );
  };

  const finished = score.liveStatus === "FINAL";
  const opponentLabel = score.opponentName || "Opponent";

  return (
    <section className="mt-8 rounded-card border border-line bg-surface p-5" aria-labelledby="live-score-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="live-score-heading" className="font-bold text-ink">Live score</h2>
        <span
          className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider ${
            score.liveStatus === "LIVE"
              ? "bg-danger/10 text-danger"
              : finished
                ? "bg-surface-2 text-ink-dim"
                : "bg-warning/10 text-warning"
          }`}
        >
          {periodLabel(score.liveStatus, score.period)}
        </span>
      </div>
      <p className="mt-1 text-sm text-ink-dim">
        {isPublic
          ? "Shown on the public homepage while the match is live (up to 4 hours from tip-off), then as the latest result for up to 3 days from tip-off, until another public match replaces it."
          : "Only coaches and admins see this score. Ask an admin to make this match public to show it on the homepage."}
      </p>

      <label className="mt-4 block max-w-sm text-xs text-ink-dim">
        Opponent
        <input
          value={opponent}
          onChange={(e) => setOpponent(e.target.value)}
          onBlur={() => {
            if (opponent.trim() !== (score.opponentName ?? "")) saveFields({ opponentName: opponent.trim() || null });
          }}
          maxLength={80}
          placeholder="e.g. Belfast Star U16"
          className="mt-1 w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-flame-ink"
        />
      </label>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {(
          [
            ["ourScore", teamName],
            ["opponentScore", opponentLabel],
          ] as const
        ).map(([side, label]) => (
          <div key={side} className="rounded-control border border-line bg-surface-2 p-4">
            <p className="truncate font-mono text-[11px] uppercase tracking-wider text-ink-faint">{label}</p>
            <p className="mt-1 font-condensed text-6xl font-extrabold tabular-nums text-ink" aria-live="polite">
              {score[side]}
            </p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[1, 2, 3].map((n) => (
                <Button
                  key={n}
                  size="lg"
                  onClick={() => bump(side, n)}
                  aria-label={`Add ${n} to ${label}`}
                >
                  +{n}
                </Button>
              ))}
              <Button
                size="lg"
                variant="secondary"
                disabled={score[side] === 0}
                onClick={() => bump(side, -1)}
                aria-label={`Take 1 off ${label}`}
              >
                −1
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {score.liveStatus === "UPCOMING" && (
          <Button onClick={() => saveFields({ liveStatus: "LIVE", period: 1 })} disabled={busy}>
            Start match
          </Button>
        )}
        {score.liveStatus === "LIVE" && (
          <>
            <label className="flex items-center gap-2 text-xs text-ink-dim">
              Quarter
              <select
                value={score.period ?? 1}
                onChange={(e) => {
                  saveFields({ period: Number(e.target.value) });
                }}
                className="rounded-control border border-line bg-surface-2 px-2 py-2 text-sm text-ink"
              >
                <option value={1}>Q1</option>
                <option value={2}>Q2</option>
                <option value={3}>Q3</option>
                <option value={4}>Q4</option>
                <option value={5}>OT</option>
                <option value={6}>OT2</option>
              </select>
            </label>
            <Button variant="secondary" onClick={() => saveFields({ liveStatus: "HALF_TIME" })} disabled={busy}>
              Half time
            </Button>
          </>
        )}
        {score.liveStatus === "HALF_TIME" && (
          <Button
            onClick={() => saveFields({ liveStatus: "LIVE", period: 3 })}
            disabled={busy}
          >
            Start second half
          </Button>
        )}
        {(score.liveStatus === "LIVE" || score.liveStatus === "HALF_TIME") && (
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() => {
              if (window.confirm(`End the match at ${score.ourScore}-${score.opponentScore}? This marks it as the final result.`)) {
                saveFields({ liveStatus: "FINAL", period: null });
              }
            }}
          >
            Full time
          </Button>
        )}
        {finished && (
          <p className="text-sm text-ink-dim">
            Full time. You can still correct the score above; every change to a final result is recorded in the audit log.
          </p>
        )}
      </div>

      {error && (
        <div className="mt-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}
    </section>
  );
}
