import type { MatchLiveStatus } from "@prisma/client";

import { prisma } from "./prisma";

/**
 * The public homepage scoreboard (app/club). Only events with visibility
 * PUBLIC ever appear — same gate as the existing "Next up" fixture — so a
 * team-only or club-only match never reaches a stranger.
 *
 * What it shows, in order of preference:
 *   1. every public match currently LIVE or at HALF_TIME;
 *   2. otherwise the most recent FINAL result from the last 3 days;
 *   3. otherwise nothing (the page's "Next up" section covers upcoming games).
 */

export const SCORE_EVENT_TYPES = ["MATCH", "TOURNAMENT"] as const;

/** How long a finished result stays on the homepage. */
const RESULT_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

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
  /** "live" while any match is in progress — the client polls only then. */
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
} as const;

type Row = {
  id: number;
  title: string;
  opponentName: string | null;
  ourScore: number | null;
  opponentScore: number | null;
  liveStatus: MatchLiveStatus | null;
  period: number | null;
  startAt: Date;
  scoreUpdatedAt: Date | null;
  locationText: string | null;
  team: { name: string } | null;
  venue: { name: string } | null;
};

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

export async function getPublicScoreboard(now: Date = new Date()): Promise<PublicScoreboard> {
  const base = {
    type: { in: [...SCORE_EVENT_TYPES] },
    visibility: "PUBLIC" as const,
    status: { not: "CANCELLED" as const },
  };

  const live = await prisma.event.findMany({
    where: { ...base, liveStatus: { in: ["LIVE", "HALF_TIME"] } },
    select,
    orderBy: { startAt: "asc" },
    take: 4,
  });
  if (live.length > 0) return { mode: "live", matches: live.map(toPublic) };

  const result = await prisma.event.findFirst({
    where: { ...base, liveStatus: "FINAL", startAt: { gte: new Date(now.getTime() - RESULT_WINDOW_MS) } },
    select,
    orderBy: { startAt: "desc" },
  });
  if (result) return { mode: "result", matches: [toPublic(result)] };

  return { mode: "none", matches: [] };
}
