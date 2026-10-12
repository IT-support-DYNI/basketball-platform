import { describe, it, expect, vi, beforeEach } from "vitest";

const db = vi.hoisted(() => ({ findMany: vi.fn(), findFirst: vi.fn() }));
vi.mock("./prisma", () => ({ prisma: { event: { findMany: db.findMany, findFirst: db.findFirst } } }));

import { getPublicScoreboard, LIVE_WINDOW_MS, RESULT_WINDOW_MS, scoreboardWhere } from "./live-scores";

const NOW = new Date("2026-10-11T15:00:00Z");

const row = (over: Record<string, unknown> = {}) => ({
  id: 1, title: "U16 v Star", opponentName: "Belfast Star", ourScore: 40, opponentScore: 38,
  liveStatus: "LIVE", period: 3, startAt: new Date("2026-10-11T14:00:00Z"), scoreUpdatedAt: null,
  locationText: "Leisure centre", team: { name: "U16" }, venue: null, ...over,
});

beforeEach(() => {
  db.findMany.mockReset().mockResolvedValue([]);
  db.findFirst.mockReset().mockResolvedValue(null);
});

describe("scoreboardWhere", () => {
  const where = scoreboardWhere(NOW);

  it.each(["live", "result"] as const)("the %s query only ever reads PUBLIC, non-cancelled matches", (k) => {
    expect(where[k]).toMatchObject({
      type: { in: ["MATCH", "TOURNAMENT"] },
      visibility: "PUBLIC",
      status: { not: "CANCELLED" },
    });
  });

  it("live means LIVE or HALF_TIME and tipped off in the last 4 hours", () => {
    expect(where.live).toMatchObject({
      liveStatus: { in: ["LIVE", "HALF_TIME"] },
      startAt: { gte: new Date(NOW.getTime() - LIVE_WINDOW_MS) },
    });
    expect(LIVE_WINDOW_MS).toBe(4 * 60 * 60 * 1000);
  });

  it("a result is FINAL and tipped off in the last 3 days", () => {
    expect(where.result).toMatchObject({
      liveStatus: "FINAL",
      startAt: { gte: new Date(NOW.getTime() - RESULT_WINDOW_MS) },
    });
  });
});

describe("getPublicScoreboard", () => {
  it("shows live matches and skips the result lookup", async () => {
    db.findMany.mockResolvedValue([row()]);
    const board = await getPublicScoreboard(NOW);
    expect(board.mode).toBe("live");
    expect(board.matches[0]).toMatchObject({ teamName: "U16", ourScore: 40, venueName: "Leisure centre" });
    expect(db.findFirst).not.toHaveBeenCalled();
    expect(db.findMany.mock.calls[0][0]).toMatchObject({ where: scoreboardWhere(NOW).live, take: 4 });
  });

  it("falls back to the latest result", async () => {
    db.findFirst.mockResolvedValue(row({ liveStatus: "FINAL", period: null }));
    const board = await getPublicScoreboard(NOW);
    expect(board.mode).toBe("result");
    expect(db.findFirst.mock.calls[0][0].where).toEqual(scoreboardWhere(NOW).result);
  });

  it("shows nothing when there is neither", async () => {
    expect(await getPublicScoreboard(NOW)).toEqual({ mode: "none", matches: [] });
  });

  it("names a club-wide match after the club and returns only public fields", async () => {
    db.findMany.mockResolvedValue([row({ team: null, venue: { name: "Main hall" } })]);
    const [m] = (await getPublicScoreboard(NOW)).matches;
    expect(m.teamName).toBe("DYNI Blazers");
    expect(m.venueName).toBe("Main hall");
    expect(Object.keys(m).sort()).toEqual(
      ["id", "liveStatus", "opponentName", "opponentScore", "ourScore", "period", "scoreUpdatedAt", "startAt", "teamName", "title", "venueName"],
    );
  });
});
