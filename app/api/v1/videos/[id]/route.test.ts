import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { Session } from "next-auth";

import { leakyVideoFixture, project, SECRET_VALUES, type Shape } from "@/lib/test/prisma-shape";
import { videoAssignmentSelect, visibleAssignmentWhere } from "@/lib/videos";

/** GET /api/v1/videos/[id] must never return another player's private data. */

const session = vi.hoisted(() => ({ current: null as unknown }));
const findFirst = vi.hoisted(() => vi.fn());

vi.mock("next-auth", () => ({ getServerSession: async () => session.current }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/storage", () => ({ getPlaybackUrl: async (k: string) => `https://signed/${k}` }));
vi.mock("@/lib/prisma", () => ({ prisma: { video: { findFirst } } }));

import { GET } from "./route";

const call = async (id = "1") => {
  const res = await GET(new NextRequest(`http://localhost/api/v1/videos/${id}`), { params: { id } });
  const text = await res.text();
  return { status: res.status, body: JSON.parse(text), text };
};

const as = (user: Record<string, unknown>) => {
  session.current = { user, expires: "" };
  return session.current as Session;
};

const ROLES = [
  { id: "50", role: "PLAYER", teamId: 2, playerId: 9 },
  { id: "5", role: "COACH", teamIds: [2] },
  { id: "1", role: "ADMIN" },
];

beforeEach(() => {
  findFirst.mockReset();
  findFirst.mockImplementation(async (args: Shape) => project(leakyVideoFixture, args));
});

describe("GET /api/v1/videos/[id]", () => {
  it.each(ROLES)("never returns password hashes, tokens or private profile fields ($role)", async (user) => {
    as(user);
    const { status, text } = await call();
    expect(status).toBe(200);
    for (const s of SECRET_VALUES) expect(text).not.toContain(s);
  });

  it.each(ROLES)("scopes assignments to what the caller may see ($role)", async (user) => {
    const s = as(user);
    await call();
    expect(findFirst.mock.calls[0][0].include.assignments).toEqual({
      where: visibleAssignmentWhere(s),
      select: videoAssignmentSelect,
    });
  });

  it("still returns what a client needs: video fields, a signed URL and assignment names", async () => {
    as({ id: "5", role: "COACH", teamIds: [2] });
    const { body } = await call();
    expect(body).toMatchObject({ id: 1, title: "Defensive slides", playbackUrl: "https://signed/videos/1.mp4" });
    expect(body.assignments).toEqual([
      { id: 10, teamId: 2, playerId: null, team: { id: 2, name: "U16" }, player: null },
      { id: 11, teamId: null, playerId: 7, team: null, player: { id: 7, user: { id: 77, name: "Other Player" } } },
    ]);
  });

  it("returns 404 when the caller can't see the video", async () => {
    findFirst.mockResolvedValueOnce(null);
    as({ id: "50", role: "PLAYER", teamId: 3, playerId: 9 });
    expect((await call()).status).toBe(404);
  });

  it("returns 404, not 500, for a non-numeric id without querying", async () => {
    as({ id: "1", role: "ADMIN" });
    expect((await call("abc")).status).toBe(404);
    expect(findFirst).not.toHaveBeenCalled();
  });
});
