import type { MatchLiveStatus } from "@prisma/client";

import type { UpdateScoreInput } from "@/lib/contracts/event";

/**
 * The rules for a live-score update, as a pure function so every transition
 * is unit-tested (lib/live-score-state.test.ts). The score route applies the
 * result; it decides nothing itself.
 *
 *  - Any score change on an unstarted match starts it: LIVE, first quarter.
 *  - Leaving "not started" for any status sets null scores to 0 (the database
 *    requires both scores once a match is in play or finished).
 *  - A quarter is only kept while the match is LIVE or at HALF_TIME.
 *  - Full time clears the quarter and completes the event.
 *  - A finished match never goes back to live (it would reappear on the
 *    public homepage as "Live now"). Its score can still be corrected, and
 *    every correction is audited.
 */

export type ScoreStatePatch = {
  liveStatus?: MatchLiveStatus;
  period?: number | null;
  /** Set both scores to 0 where they are still null (the match is leaving "not started"). */
  zeroNullScores: boolean;
  completeEvent: boolean;
  audit: null | "STATUS_CHANGED" | "CORRECTED";
};

export type ScoreStateResult = { ok: true; patch: ScoreStatePatch } | { ok: false; error: string };

const IN_PLAY: readonly MatchLiveStatus[] = ["LIVE", "HALF_TIME"];

export function nextScoreState(current: MatchLiveStatus | null, body: UpdateScoreInput): ScoreStateResult {
  const touchesScore =
    body.ourScore !== undefined ||
    body.opponentScore !== undefined ||
    body.addOur !== undefined ||
    body.addOpponent !== undefined;
  const notStarted = current === null || current === "UPCOMING";

  if (current === "FINAL" && body.liveStatus !== undefined && body.liveStatus !== "FINAL") {
    return { ok: false, error: "This match has finished. Correct the score directly; it can't go back to live." };
  }

  const liveStatus = body.liveStatus ?? (touchesScore && notStarted ? "LIVE" : undefined);
  const after = liveStatus ?? current;
  const starting = liveStatus === "LIVE" && notStarted;

  if (body.period != null && !IN_PLAY.includes(after as MatchLiveStatus)) {
    return { ok: false, error: "The quarter can only be set while the match is in play." };
  }

  let period: number | null | undefined = body.period;
  if (starting) period = body.period ?? 1;
  else if (liveStatus !== undefined && !IN_PLAY.includes(liveStatus)) period = null;

  const changesStatus = liveStatus !== undefined && liveStatus !== current;
  const audit = changesStatus
    ? "STATUS_CHANGED"
    : current === "FINAL" && (touchesScore || body.opponentName !== undefined)
      ? "CORRECTED"
      : null;

  return {
    ok: true,
    patch: {
      ...(liveStatus !== undefined ? { liveStatus } : {}),
      ...(period !== undefined ? { period } : {}),
      zeroNullScores: notStarted && liveStatus !== undefined && liveStatus !== "UPCOMING",
      completeEvent: liveStatus === "FINAL",
      audit,
    },
  };
}
