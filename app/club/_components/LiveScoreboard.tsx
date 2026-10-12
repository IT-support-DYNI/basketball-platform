"use client";

import { useEffect, useState } from "react";

import type { PublicScoreboard } from "@/lib/live-scores";
import { periodLabel } from "@/lib/live-score-labels";

/** Poll fast while a match is on, slowly otherwise (to notice one starting). */
const LIVE_POLL_MS = 15_000;
const IDLE_POLL_MS = 60_000;

/**
 * Homepage live score strip. Server-rendered with the current scoreboard so
 * it's there on first paint (and for crawlers), then kept fresh by polling
 * /api/v1/public/live-scores — paused while the tab is hidden. Renders nothing
 * when there is no live match or recent result.
 */
export default function LiveScoreboard({ initial }: { initial: PublicScoreboard }) {
  const [board, setBoard] = useState(initial);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const schedule = (mode: PublicScoreboard["mode"]) => {
      timer = setTimeout(tick, mode === "live" ? LIVE_POLL_MS : IDLE_POLL_MS);
    };

    async function tick() {
      if (cancelled) return;
      if (document.visibilityState === "hidden") return schedule("none");
      try {
        const res = await fetch("/api/v1/public/live-scores", { cache: "no-store" });
        if (res.ok) {
          const next = (await res.json()) as PublicScoreboard;
          if (!cancelled) setBoard(next);
          return schedule(next.mode);
        }
      } catch {
        // Network blip — keep showing the last score and try again.
      }
      schedule(board.mode);
    }

    schedule(board.mode);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        if (timer) clearTimeout(timer);
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // Polling cadence is driven from inside tick(); only start it once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (board.mode === "none" || board.matches.length === 0) return null;

  const live = board.mode === "live";

  return (
    <section className="scoreboard" id="live-score" aria-labelledby="scoreboard-heading">
      <div className="wrap">
        <p className="eyebrow" id="scoreboard-heading">
          {live ? (
            <>
              <span className="dot-live" aria-hidden="true" /> Live now
            </>
          ) : (
            "Latest result"
          )}
        </p>
        <ul className="scoreboard-list">
          {board.matches.map((m) => {
            const opponent = m.opponentName || "Opponent";
            const status = periodLabel(m.liveStatus, m.period);
            return (
              <li key={m.id} className="scoreboard-card">
                {/* One sentence for screen readers, announced politely when it changes. */}
                <p className="sr-only" aria-live="polite">
                  {`${m.teamName} ${m.ourScore}, ${opponent} ${m.opponentScore}. ${status}.`}
                </p>
                <div className="scoreboard-row" aria-hidden="true">
                  <span className="scoreboard-team">{m.teamName}</span>
                  <span className="scoreboard-score">
                    {m.ourScore}
                    <span className="scoreboard-dash">-</span>
                    {m.opponentScore}
                  </span>
                  <span className="scoreboard-team scoreboard-team-away">{opponent}</span>
                </div>
                <p className="scoreboard-meta">
                  <span className={`scoreboard-status${m.liveStatus === "LIVE" ? " is-live" : ""}`}>{status}</span>
                  {m.venueName ? ` · ${m.venueName}` : ""}
                  {!live ? ` · ${new Date(m.startAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}` : ""}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
