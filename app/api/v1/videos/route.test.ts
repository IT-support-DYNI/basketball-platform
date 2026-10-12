import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { Session } from "next-auth";

import { leakyVideoFixture, project, SECRET_VALUES, type Shape } from "@/lib/test/prisma-shape";
import { videoAssignmentSelect, visibleAssignmentWhere } from "@/lib/videos";

/** GET /api/v1/videos applies the same assignment scope as the single-video route. */

const session = vi.hoisted(() => ({ current: null as unknown }));
const findMany = vi.hoisted(() => vi.fn());

vi.mock("next-auth", () => ({ getServerSession: async () => session.current }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/storage", () => ({ getPlaybackUrl: async (k: string) => `https://signed/${k}` }));
vi.mock("@/lib/prisma", () => ({ prisma: { video: { findMany } } }));

import { GET } from "./route";

beforeEach(() => {
  findMany.mockReset();
  findMany.mockImplementation(async (args: Shape) => [project(leakyVideoFixture, args)]);
});

describe("GET /api/v1/videos", () => {
  it.each([
    { id: "50", role: "PLAYER", teamId: 2, playerId: 9 },
    { id: "5", role: "COACH", teamIds: [2] },
    { id: "1", role: "ADMIN" },
  ])("scopes assignments and leaks no private fields ($role)", async (user) => {
    session.current = { user, expires: "" };
    const res = await GET(new NextRequest("http://localhost/api/v1/videos"), { params: {} });
    const text = await res.text();

    expect(res.status).toBe(200);
    for (const s of SECRET_VALUES) expect(text).not.toContain(s);
    expect(findMany.mock.calls[0][0].include.assignments).toEqual({
      where: visibleAssignmentWhere(session.current as Session),
      select: videoAssignmentSelect,
    });
  });
});
