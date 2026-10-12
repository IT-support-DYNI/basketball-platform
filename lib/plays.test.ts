import { describe, it, expect } from "vitest";
import type { Session } from "next-auth";
import type { UserRole } from "@prisma/client";

import { authorize } from "./authz/guard";
import { createPlaySchema, setPlayAssignmentsSchema } from "./contracts/playbook";
import { groupByType, planAssignmentChange } from "./playbook";

function sess(over: Partial<Session["user"]>): Session {
  return {
    user: { id: "1", name: "T", email: "t@example.com", role: "PLAYER" as UserRole, isActive: true, mustChangePassword: false, ...over },
    expires: "2099-01-01",
  } as Session;
}
const admin = sess({ id: "10", role: "ADMIN" as UserRole });
const coachA = sess({ id: "20", role: "COACH" as UserRole, teamIds: [1] });
const coachB = sess({ id: "21", role: "COACH" as UserRole, teamIds: [2] });
const player = sess({ id: "30", role: "PLAYER" as UserRole, playerId: 30, teamId: 1 });
const guardian = sess({ id: "40", role: "GUARDIAN" as UserRole });

describe("Play permissions", () => {
  it("any coach reads the library and creates plays", () => {
    for (const c of [coachA, coachB]) {
      expect(authorize(c).can("read", "Play")).toBe(true);
      expect(authorize(c).can("create", "Play")).toBe(true);
    }
  });

  it("only the author (or an admin) edits or archives a play", () => {
    const authoredByA = { createdByUserId: 20 };
    expect(authorize(coachA).can("update", "Play", authoredByA)).toBe(true);
    expect(authorize(coachA).can("delete", "Play", authoredByA)).toBe(true);
    expect(authorize(coachB).can("update", "Play", authoredByA)).toBe(false);
    expect(authorize(coachB).can("delete", "Play", authoredByA)).toBe(false);
    expect(authorize(admin).can("update", "Play", authoredByA)).toBe(true);
  });

  it("players and guardians have no library rights (they read through team assignments)", () => {
    for (const s of [player, guardian]) {
      expect(authorize(s).can("read", "Play")).toBe(false);
      expect(authorize(s).can("create", "Play")).toBe(false);
      expect(authorize(s).can("update", "Play", { createdByUserId: Number(s.user.id) })).toBe(false);
    }
  });
});

describe("planAssignmentChange", () => {
  it("adds and removes only among the coach's own teams", () => {
    expect(planAssignmentChange({ current: [1, 2], requested: [3], manageable: [1, 3], archived: false })).toEqual({
      toAdd: [3],
      toRemove: [1], // team 2 belongs to another coach: untouched
    });
  });

  it("refuses a team the caller doesn't coach", () => {
    expect(() => planAssignmentChange({ current: [], requested: [2], manageable: [1], archived: false })).toThrow(
      /teams you coach/,
    );
  });

  it("is a no-op when nothing changes", () => {
    expect(planAssignmentChange({ current: [1], requested: [1], manageable: [1], archived: false })).toEqual({
      toAdd: [],
      toRemove: [],
    });
  });

  it("an archived play can come off teams but not go onto new ones", () => {
    expect(planAssignmentChange({ current: [1], requested: [], manageable: [1], archived: true })).toEqual({
      toAdd: [],
      toRemove: [1],
    });
    expect(() => planAssignmentChange({ current: [], requested: [1], manageable: [1], archived: true })).toThrow(/Restore/);
  });
});

describe("play contracts", () => {
  it("defaults the type and accepts a diagram", () => {
    const p = createPlaySchema.parse({ name: "Horns", courtDiagram: { markers: [], arrows: [] } });
    expect(p.type).toBe("OFFENCE");
  });

  it("rejects bad names, types and diagrams", () => {
    expect(createPlaySchema.safeParse({ name: "H" }).success).toBe(false);
    expect(createPlaySchema.safeParse({ name: "Horns", type: "ZONE" }).success).toBe(false);
    expect(
      createPlaySchema.safeParse({ name: "Horns", courtDiagram: { markers: [{ id: "a", kind: "player", x: 2, y: 0 }], arrows: [] } })
        .success,
    ).toBe(false);
  });

  it("caps the team list", () => {
    expect(setPlayAssignmentsSchema.safeParse({ teamIds: [1, 2] }).success).toBe(true);
    expect(setPlayAssignmentsSchema.safeParse({ teamIds: [0] }).success).toBe(false);
  });
});

describe("groupByType", () => {
  it("orders groups by play type and drops empty ones", () => {
    const groups = groupByType([
      { id: 1, type: "DEFENCE" },
      { id: 2, type: "OFFENCE" },
      { id: 3, type: "OFFENCE" },
    ]);
    expect(groups.map(([t, l]) => [t, l.length])).toEqual([
      ["OFFENCE", 2],
      ["DEFENCE", 1],
    ]);
  });
});
