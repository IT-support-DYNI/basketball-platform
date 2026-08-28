import { describe, it, expect } from "vitest";
import type { Session } from "next-auth";
import type { UserRole } from "@prisma/client";

import { authorize, requireTeamAccess, requirePlayerAccess, canViewPlayerContactDetails, requireRole, requireAuth } from "./guard";
import { roleAssignmentsFor } from "./roles";

/**
 * The permission matrix — the highest-value test suite in the codebase
 * (Doc 5 §17.1). Every role is checked against every subject/action it should
 * and should NOT be able to touch, including cross-team and cross-tenant
 * negative cases.
 */

function sess(over: Partial<Session["user"]>): Session {
  return {
    user: {
      id: "1",
      name: "Test",
      email: "t@example.com",
      role: "PLAYER" as UserRole,
      isActive: true,
      mustChangePassword: false,
      ...over,
    },
    expires: "2099-01-01",
  } as Session;
}

const admin = sess({ id: "10", role: "ADMIN" as UserRole });
const coach1 = sess({ id: "20", role: "COACH" as UserRole, coachProfileId: 20, teamIds: [1] });
const coach12 = sess({ id: "21", role: "COACH" as UserRole, coachProfileId: 21, teamIds: [1, 2] });
const coachNoTeam = sess({ id: "22", role: "COACH" as UserRole, coachProfileId: 22, teamIds: [] });
const player1 = sess({ id: "30", role: "PLAYER" as UserRole, playerId: 30, teamId: 1 });
const player2 = sess({ id: "31", role: "PLAYER" as UserRole, playerId: 31, teamId: 2 });
const supporter = sess({ id: "40", role: "SUPPORTER" as UserRole });

describe("roleAssignmentsFor", () => {
  it("maps the legacy single role onto the new model", () => {
    expect(roleAssignmentsFor(admin)).toEqual([{ role: "CLUB_ADMIN", scope: { clubId: undefined } }]);
    expect(roleAssignmentsFor(player1)).toEqual([{ role: "PLAYER", scope: { clubId: undefined, teamId: 1 } }]);
  });

  it("gives a coach a base assignment plus one per team", () => {
    const a = roleAssignmentsFor(coach12);
    expect(a).toHaveLength(3);
    expect(a[0]).toEqual({ role: "HEAD_COACH", scope: { clubId: undefined } });
    expect(a.filter((x) => x.scope.teamId != null).map((x) => x.scope.teamId)).toEqual([1, 2]);
  });

  it("grants nothing for an unmapped role", () => {
    expect(roleAssignmentsFor(supporter)).toEqual([]);
  });
});

describe("club admin", () => {
  const can = authorize(admin);
  it("can manage everything", () => {
    expect(can.can("manage", "all")).toBe(true);
    expect(can.can("delete", "Team", { id: 999 })).toBe(true);
    expect(can.can("read", "PlayerMedical", { teamId: 7 })).toBe(true);
    expect(can.can("approve", "Registration")).toBe(true);
    expect(can.can("create", "Season")).toBe(true);
    expect(can.can("create", "Squad", { teamId: 3 })).toBe(true);
    expect(can.can("update", "Membership", { teamId: 3 })).toBe(true);
  });
});

describe("head coach — own team only", () => {
  const c = authorize(coach1);

  it("accesses its own team, not another", () => {
    expect(c.can("access", "Team", { id: 1 })).toBe(true);
    expect(c.can("access", "Team", { id: 2 })).toBe(false);
  });

  it("manages training + attendance for its team, not another", () => {
    expect(c.can("create", "TrainingSession", { teamId: 1 })).toBe(true);
    expect(c.can("create", "TrainingSession", { teamId: 2 })).toBe(false);
    expect(c.can("record", "Attendance", { teamId: 1 })).toBe(true);
    expect(c.can("record", "Attendance", { teamId: 2 })).toBe(false);
    expect(c.can("verify", "Attendance", { teamId: 1 })).toBe(true);
  });

  it("reads roster + contact for its team, not another", () => {
    expect(c.can("read", "PlayerProfile", { teamId: 1 })).toBe(true);
    expect(c.can("read", "PlayerContact", { teamId: 1 })).toBe(true);
    expect(c.can("update", "PlayerProfile", { teamId: 1 })).toBe(true);
    expect(c.can("read", "PlayerProfile", { teamId: 2 })).toBe(false);
    expect(c.can("read", "PlayerContact", { teamId: 2 })).toBe(false);
  });

  it("edits only announcements it authored", () => {
    expect(c.can("create", "Announcement", { teamId: 1 })).toBe(true);
    expect(c.can("update", "Announcement", { teamId: 1, authorUserId: 20 })).toBe(true);
    expect(c.can("delete", "Announcement", { teamId: 1, authorUserId: 20 })).toBe(true);
    expect(c.can("update", "Announcement", { teamId: 1, authorUserId: 99 })).toBe(false);
  });

  it("has no access to medical/welfare notes", () => {
    expect(c.can("read", "PlayerMedical", { teamId: 1 })).toBe(false);
    expect(c.can("read", "PlayerWelfare", { teamId: 1 })).toBe(false);
  });

  it("reads its own team's squads + memberships, not another's", () => {
    expect(c.can("read", "Squad", { teamId: 1 })).toBe(true);
    expect(c.can("read", "Membership", { teamId: 1 })).toBe(true);
    expect(c.can("read", "Squad", { teamId: 2 })).toBe(false);
    expect(c.can("read", "Season")).toBe(true);
    // organisation changes are admin-only
    expect(c.can("create", "Squad", { teamId: 1 })).toBe(false);
    expect(c.can("update", "Season")).toBe(false);
  });

  it("a coach on two teams reaches both", () => {
    const c2 = authorize(coach12);
    expect(c2.can("access", "Team", { id: 1 })).toBe(true);
    expect(c2.can("access", "Team", { id: 2 })).toBe(true);
    expect(c2.can("record", "Attendance", { teamId: 2 })).toBe(true);
  });

  it("a coach with no team assignment can't touch team data", () => {
    const c0 = authorize(coachNoTeam);
    expect(c0.can("access", "Team", { id: 1 })).toBe(false);
    expect(c0.can("record", "Attendance", { teamId: 1 })).toBe(false);
  });
});

describe("player — self only", () => {
  const p = authorize(player1);

  it("accesses its own team's schedule + announcements, not another team's", () => {
    expect(p.can("access", "Team", { id: 1 })).toBe(true);
    expect(p.can("access", "Team", { id: 2 })).toBe(false);
    expect(p.can("read", "TrainingSession", { teamId: 1 })).toBe(true);
    expect(p.can("read", "TrainingSession", { teamId: 2 })).toBe(false);
    expect(p.can("read", "Announcement", { teamId: 1 })).toBe(true);
    expect(p.can("read", "Announcement", { scope: "PLATFORM" })).toBe(true);
    expect(p.can("read", "Announcement", { teamId: 2 })).toBe(false);
  });

  it("reads its own profile/stats/feedback, not another player's", () => {
    expect(p.can("read", "PlayerProfile", { id: 30 })).toBe(true);
    expect(p.can("read", "PlayerProfile", { id: 31 })).toBe(false);
    expect(p.can("read", "Evaluation", { playerId: 30 })).toBe(true);
    expect(p.can("read", "Evaluation", { playerId: 31 })).toBe(false);
    expect(p.can("read", "Feedback", { playerId: 30 })).toBe(true);
    expect(p.can("read", "Attendance", { playerId: 31 })).toBe(false);
  });

  it("updates only its own contact details", () => {
    expect(p.can("update", "PlayerContact", { id: 30 })).toBe(true);
    expect(p.can("update", "PlayerContact", { id: 31 })).toBe(false);
    expect(p.can("update", "PlayerProfile", { id: 30 })).toBe(false);
  });

  it("cannot touch the record of the game or a coach's assessment", () => {
    expect(p.can("create", "Evaluation", { playerId: 30 })).toBe(false);
    expect(p.can("update", "Evaluation", { playerId: 30 })).toBe(false);
    expect(p.can("record", "Attendance", { playerId: 30 })).toBe(false);
    expect(p.can("verify", "Attendance", { teamId: 1 })).toBe(false);
    expect(p.can("create", "TrainingSession", { teamId: 1 })).toBe(false);
    expect(p.can("update", "TrainingSession", { teamId: 1 })).toBe(false);
    expect(p.can("delete", "TrainingSession", { teamId: 1 })).toBe(false);
  });

  it("manages only its own notifications", () => {
    expect(p.can("read", "Notification", { userId: 30 })).toBe(true);
    expect(p.can("update", "Notification", { userId: 30 })).toBe(true);
    expect(p.can("read", "Notification", { userId: 99 })).toBe(false);
  });

  it("player 2 is symmetric — no access to team 1", () => {
    const p2 = authorize(player2);
    expect(p2.can("access", "Team", { id: 2 })).toBe(true);
    expect(p2.can("access", "Team", { id: 1 })).toBe(false);
    expect(p2.can("read", "Evaluation", { playerId: 30 })).toBe(false);
  });
});

describe("supporter / unauthenticated", () => {
  it("can do nothing", () => {
    const s = authorize(supporter);
    expect(s.can("read", "Team", { id: 1 })).toBe(false);
    expect(s.can("read", "PlayerProfile", { id: 1 })).toBe(false);
    expect(s.can("manage", "all")).toBe(false);
  });
});

describe("back-compat guards preserve prior behaviour", () => {
  it("requireAuth", () => {
    expect(() => requireAuth(null)).toThrow();
    expect(() => requireAuth(sess({ isActive: false }))).toThrow();
    expect(requireAuth(player1)).toBe(player1);
  });

  it("requireRole", () => {
    expect(() => requireRole(player1, ["ADMIN"] as UserRole[])).toThrow();
    expect(() => requireRole(coach1, ["COACH", "ADMIN"] as UserRole[])).not.toThrow();
  });

  it("requireTeamAccess", () => {
    expect(() => requireTeamAccess(coach1, 1)).not.toThrow();
    expect(() => requireTeamAccess(coach1, 2)).toThrow(/access to this team/);
    expect(() => requireTeamAccess(player1, 1)).not.toThrow();
    expect(() => requireTeamAccess(player1, 2)).toThrow();
    expect(() => requireTeamAccess(admin, 999)).not.toThrow();
  });

  it("requirePlayerAccess", () => {
    expect(() => requirePlayerAccess(coach1, { id: 5, teamIds: [1] })).not.toThrow();
    expect(() => requirePlayerAccess(coach1, { id: 5, teamIds: [2] })).toThrow();
    expect(() => requirePlayerAccess(coach1, { id: 5, teamIds: [] })).toThrow();
    expect(() => requirePlayerAccess(player1, { id: 30, teamIds: [1] })).not.toThrow();
    expect(() => requirePlayerAccess(player1, { id: 31, teamIds: [1] })).toThrow();
    expect(() => requirePlayerAccess(admin, { id: 999, teamIds: [999] })).not.toThrow();
  });

  it("canViewPlayerContactDetails — admins and the player's coach, not the player", () => {
    expect(canViewPlayerContactDetails(admin, { id: 1, teamIds: [9] })).toBe(true);
    expect(canViewPlayerContactDetails(coach1, { id: 5, teamIds: [1] })).toBe(true);
    expect(canViewPlayerContactDetails(coach1, { id: 5, teamIds: [2] })).toBe(false);
    expect(canViewPlayerContactDetails(player1, { id: 30, teamIds: [1] })).toBe(false);
  });
});
