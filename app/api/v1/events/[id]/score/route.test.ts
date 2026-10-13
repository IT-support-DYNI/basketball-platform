import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * PATCH /api/v1/events/{id}/score — the route wiring: who may score, what is
 * rejected, how taps reach the database, and what gets audited. The status
 * rules themselves are tested in lib/live-score-state.test.ts.
 */

const session = vi.hoisted(() => ({ current: null as unknown }));
const db = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  executeRaw: vi.fn(),
  logAudit: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: async () => session.current }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/audit", () => ({ logAudit: db.logAudit }));
vi.mock("@/lib/prisma", () => {
  const tx = { $executeRaw: db.executeRaw, event: { update: db.update } };
  return {
    prisma: {
      event: { findUnique: db.findUnique },
      $transaction: async (fn: (t: typeof tx) => unknown) => fn(tx),
    },
  };
});

import { PATCH } from "./route";

const coach = { id: "20", role: "COACH", coachProfileId: 20, teamIds: [1], isActive: true, mustChangePassword: false };
const admin = { id: "10", role: "ADMIN", isActive: true, mustChangePassword: false };

const match = (over: Record<string, unknown> = {}) => ({
  id: 5, type: "MATCH", teamId: 1, status: "SCHEDULED", liveStatus: "LIVE", ourScore: 10, opponentScore: 8, ...over,
});

let loaded: Record<string, unknown> | null = null;
const load = (row: Record<string, unknown> | null) => {
  loaded = row;
  db.findUnique.mockResolvedValue(row);
};

const patch = async (body: unknown, raw?: string) => {
  const res = await PATCH(
    new NextRequest("http://localhost/api/v1/events/5/score", { method: "PATCH", body: raw ?? JSON.stringify(body) }),
    { params: { id: "5" } },
  );
  return { status: res.status, body: await res.json() };
};

beforeEach(() => {
  vi.clearAllMocks();
  session.current = { user: coach, expires: "" };
  load(match());
  // The saved row is whatever the route loaded, plus what it wrote. Like
  // Prisma, an `undefined` field in `data` means "leave unchanged".
  db.update.mockImplementation(async ({ data }) => ({
    ...loaded,
    ...Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)),
  }));
});

describe("PATCH /api/v1/events/{id}/score", () => {
  it("a coach of another team gets 403 and nothing is written", async () => {
    load(match({ teamId: 2 }));
    expect((await patch({ addOur: 2 })).status).toBe(403);
    expect(db.update).not.toHaveBeenCalled();
  });

  it("a coach can't score a club-wide match; an admin can", async () => {
    load(match({ teamId: null }));
    expect((await patch({ addOur: 2 })).status).toBe(403);
    session.current = { user: admin, expires: "" };
    expect((await patch({ addOur: 2 })).status).toBe(200);
  });

  it("players can't score at all", async () => {
    session.current = { user: { id: "30", role: "PLAYER", playerId: 30, teamId: 1 }, expires: "" };
    expect((await patch({ addOur: 2 })).status).toBe(403);
  });

  it.each([
    [{ type: "TRAINING" }, "Only matches and tournaments"],
    [{ status: "CANCELLED" }, "cancelled"],
  ])("rejects %j with 400", async (over, msg) => {
    load(match(over));
    const { status, body } = await patch({ addOur: 2 });
    expect(status).toBe(400);
    expect(body.error).toContain(msg);
  });

  it("returns 404 for an unknown event", async () => {
    load(null);
    expect((await patch({ addOur: 2 })).status).toBe(404);
  });

  it("returns 400, not 500, for a malformed body", async () => {
    const { status, body } = await patch(undefined, "{not json");
    expect(status).toBe(400);
    expect(body.error).toMatch(/valid JSON/);
  });

  it("applies a tap as one atomic, clamped SQL increment", async () => {
    await patch({ addOur: 3 });
    expect(db.executeRaw).toHaveBeenCalledTimes(1);
    const [sql, ...values] = db.executeRaw.mock.calls[0];
    expect(sql.join("?")).toMatch(/GREATEST\(0, LEAST\(300, COALESCE\("ourScore", 0\) \+ \?\)\)/);
    expect(values).toEqual([3, 0, 5]);
    expect(db.update.mock.calls[0][0].data.ourScore).toBeUndefined();
  });

  it("a status change is audited; a basket during play is not", async () => {
    await patch({ addOur: 2 });
    expect(db.logAudit).not.toHaveBeenCalled();
    await patch({ liveStatus: "FINAL" });
    expect(db.logAudit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ action: "MATCH_SCORE_STATUS_CHANGED" }));
    expect(db.update.mock.calls[1][0].data).toMatchObject({ liveStatus: "FINAL", period: null, status: "COMPLETED" });
  });

  it("correcting a finished match is audited with before and after", async () => {
    load(match({ liveStatus: "FINAL", status: "COMPLETED" }));
    await patch({ ourScore: 12 });
    expect(db.logAudit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        action: "MATCH_SCORE_CORRECTED",
        metadata: {
          from: { liveStatus: "FINAL", ourScore: 10, opponentScore: 8 },
          to: { liveStatus: "FINAL", ourScore: 12, opponentScore: 8 },
        },
      }),
    );
  });

  it("refuses to put a finished match back to live", async () => {
    load(match({ liveStatus: "FINAL", status: "COMPLETED" }));
    const { status } = await patch({ liveStatus: "LIVE" });
    expect(status).toBe(400);
    expect(db.update).not.toHaveBeenCalled();
  });

  it("starting a match sets null scores to 0 and Q1", async () => {
    load(match({ liveStatus: null, ourScore: null, opponentScore: null }));
    await patch({ liveStatus: "LIVE" });
    expect(db.update.mock.calls[0][0].data).toMatchObject({ liveStatus: "LIVE", period: 1, ourScore: 0, opponentScore: 0 });
  });
});
