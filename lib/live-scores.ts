import type { MatchLiveStatus, Prisma } from "@prisma/client";

import { prisma } from "./prisma";

/**
 * The public homepage scoreboard (app/club). Only events with visibility
 * PUBLIC ever appear — same gate as the existing "Next up" fixture — so a
 * team-only or club-only match never reaches a stranger.
 *
 * What it shows, in order of preference:
 *   1. up to 4 public matches currently LIVE or at HALF_TIME that tipped off
 *      in the last 4 hours (a match nobody marked full time drops off then,
 *      instead of showing as "Live now" for good);
 *   2. otherwise the most recent FINAL result that tipped off in the last
 *      3 days;
 *   3. otherwise nothing.
 */

export const SCORE_EVENT_TYPES = ["MATCH", "TOURNAMENT"] as const;

/** How long after tip-off a match can still show as live. */
export const LIVE_WINDOW_MS = 4 * 60 * 60 * 1000;
/** How long after tip-off a finished result stays on the homepage. */
export const RESULT_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export type PublicScore = {
  id: number;
  title: string;
  teamName: string;
  opponentName: string | null;
  ourScore: number;
  opponentScore: number;
  liveStatus: MatchLiveStatus;
  period: number | null;
  startAt: string;
  venueName: string | null;
  scoreUpdatedAt: string | null;
};

export type PublicScoreboard = {
  /** "live" while any match is in progress; the client polls every 15s then, every 60s otherwise. */
  mode: "live" | "result" | "none";
  matches: PublicScore[];
};

const select = {
  id: true,
  title: true,
  opponentName: true,
  ourScore: true,
  opponentScore: true,
  liveStatus: true,
  period: true,
  startAt: true,
  scoreUpdatedAt: true,
  locationText: true,
  team: { select: { name: true } },
  venue: { select: { name: true } },
} satisfies Prisma.EventSelect;

type Row = Prisma.EventGetPayload<{ select: typeof select }>;

function toPublic(e: Row): PublicScore {
  return {
    id: e.id,
    title: e.title,
    teamName: e.team?.name ?? "DYNI Blazers",
    opponentName: e.opponentName,
    ourScore: e.ourScore ?? 0,
    opponentScore: e.opponentScore ?? 0,
    liveStatus: e.liveStatus ?? "UPCOMING",
    period: e.period,
    startAt: e.startAt.toISOString(),
    venueName: e.venue?.name ?? e.locationText ?? null,
    scoreUpdatedAt: e.scoreUpdatedAt?.toISOString() ?? null,
  };
}

/** The two scoreboard queries' filters. Pure, so the visibility gate and the
 *  time windows are unit-tested (lib/live-scores.test.ts). */
export function scoreboardWhere(now: Date): { live: Prisma.EventWhereInput; result: Prisma.EventWhereInput } {
  const base = {
    type: { in: [...SCORE_EVENT_TYPES] },
    visibility: "PUBLIC" as const,
    status: { not: "CANCELLED" as const },
  };
  return {
    live: {
      ...base,
      liveStatus: { in: ["LIVE", "HALF_TIME"] },
      startAt: { gte: new Date(now.getTime() - LIVE_WINDOW_MS) },
    },
    result: {
      ...base,
      liveStatus: "FINAL",
      startAt: { gte: new Date(now.getTime() - RESULT_WINDOW_MS) },
    },
  };
}

export async function getPublicScoreboard(now: Date = new Date()): Promise<PublicScoreboard> {
  const where = scoreboardWhere(now);

  const live = await prisma.event.findMany({ where: where.live, select, orderBy: { startAt: "asc" }, take: 4 });
  if (live.length > 0) return { mode: "live", matches: live.map(toPublic) };

  const result = await prisma.event.findFirst({ where: where.result, select, orderBy: { startAt: "desc" } });
  if (result) return { mode: "result", matches: [toPublic(result)] };

  return { mode: "none", matches: [] };
}
