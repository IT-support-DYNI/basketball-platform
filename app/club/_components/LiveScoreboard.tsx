"use client";

import { useEffect, useRef, useState } from "react";

import type { PublicScoreboard } from "@/lib/live-scores";
import { periodLabel } from "@/lib/live-score-labels";

/** Poll fast while a match is on, slowly otherwise (to notice one starting). */
const LIVE_POLL_MS = 15_000;
const IDLE_POLL_MS = 60_000;
/** After this many failed polls in a row, say the score may be out of date. */
const STALE_AFTER_FAILURES = 3;

const EMPTY: PublicScoreboard = { mode: "none", matches: [] };

/**
 * Homepage live score strip. Server-rendered with the current scoreboard so
 * it's there on first paint (and for crawlers), then kept fresh by polling
 * /api/v1/public/live-scores, paused while the tab is hidden. `initial` is
 * null when the server couldn't load it; polling then fills it in. Renders
 * nothing when there is no live match or recent result.
 */
export default function LiveScoreboard({ initial }: { initial: PublicScoreboard | null }) {
  const [board, setBoard] = useState(initial ?? EMPTY);
  const [stale, setStale] = useState(false);
  // The latest board for the polling loop, which is set up once and would
  // otherwise only ever see the first render's value.
  const boardRef = useRef(board);
  boardRef.current = board;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    let inFlight = false;
    let failures = 0;

    const schedule = (mode: PublicScoreboard["mode"]) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(tick, mode === "live" ? LIVE_POLL_MS : IDLE_POLL_MS);
    };

    async function tick() {
      // One request at a time: a tab switch mid-fetch must not start a
      // second polling loop.
      if (cancelled || inFlight) return;
      if (document.visibilityState === "hidden") return schedule("none");
      inFlight = true;
      try {
        const res = await fetch("/api/v1/public/live-scores", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const next = (await res.json()) as PublicScoreboard;
        if (cancelled) return;
        failures = 0;
        setStale(false);
        setBoard(next);
        schedule(next.mode);
      } catch (err) {
        if (cancelled) return;
        failures += 1;
        if (failures === STALE_AFTER_FAILURES) console.warn("[scoreboard] updates failing", err);
        if (failures >= STALE_AFTER_FAILURES) setStale(true);
        schedule(boardRef.current.mode);
      } finally {
        inFlight = false;
      }
    }

    schedule(initial ? initial.mode : "live");
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
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
        {stale && <p className="scoreboard-meta">Score updates paused. Refresh the page to check the latest.</p>}
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
                  {!live ? ` · ${new Date(m.startAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/London" })}` : ""}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
