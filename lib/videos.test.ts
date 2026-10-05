import { describe, it, expect } from "vitest";
import type { Session } from "next-auth";

import { visibleVideoWhere } from "./videos";

function session(overrides: Partial<Session["user"]>): Session {
  return {
    user: { id: "1", role: "PLAYER", isActive: true, mustChangePassword: false, ...overrides },
    expires: "",
  } as Session;
}

describe("visibleVideoWhere", () => {
  it("admin sees every video — no filter", () => {
    expect(visibleVideoWhere(session({ role: "ADMIN" }))).toEqual({});
  });

  it("a coach sees their own uploads plus their teams' assignments, nothing else", () => {
    const where = visibleVideoWhere(session({ role: "COACH", id: "7", teamIds: [3, 4] }));
    expect(where).toEqual({
      OR: [
        { uploadedByUserId: 7 },
        { assignments: { some: { teamId: { in: [3, 4] } } } },
      ],
    });
  });

  it("a player sees only videos assigned to their team or to them personally", () => {
    const where = visibleVideoWhere(session({ role: "PLAYER", teamId: 5, playerId: 12 }));
    expect(where).toEqual({
      assignments: { some: { OR: [{ teamId: 5 }, { playerId: 12 }] } },
    });
  });

  it("a player with no team/player id yet can't match any assignment (no unscoped access)", () => {
    const where = visibleVideoWhere(session({ role: "PLAYER" }));
    expect(where).toEqual({
      assignments: { some: { OR: [{ teamId: -1 }, { playerId: -1 }] } },
    });
  });
});
