import { describe, it, expect } from "vitest";

import { navFor, primaryNavFor, capabilitiesFor } from "./navigation";

describe("navigation", () => {
  it("gives a player their own menu, no admin items", () => {
    const items = navFor("PLAYER");
    const hrefs = items.map((i) => i.href);
    expect(hrefs).toContain("/player/dashboard");
    expect(hrefs).toContain("/player/my-team");
    expect(hrefs.some((h) => h.startsWith("/admin/"))).toBe(false);
    expect(hrefs.some((h) => h.startsWith("/coach/"))).toBe(false);
  });

  it("gives an admin the admin menu, no player items", () => {
    const hrefs = navFor("ADMIN").map((i) => i.href);
    expect(hrefs).toContain("/admin/registrations");
    expect(hrefs).toContain("/admin/audit");
    expect(hrefs.some((h) => h.startsWith("/player/"))).toBe(false);
  });

  it("the audit log is admin-only", () => {
    for (const role of ["PLAYER", "COACH", "GUARDIAN"]) {
      expect(navFor(role).map((i) => i.href)).not.toContain("/admin/audit");
    }
  });

  it("merges and de-duplicates for a user holding two roles", () => {
    const items = navFor(["COACH", "ADMIN"]);
    const hrefs = items.map((i) => i.href);
    // both role areas present
    expect(hrefs).toContain("/coach/training");
    expect(hrefs).toContain("/admin/teams");
    // no duplicate hrefs
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("a guardian gets the children view, announcements + security only", () => {
    const hrefs = navFor("GUARDIAN").map((i) => i.href);
    expect(hrefs).toContain("/guardian");
    expect(hrefs).toContain("/announcements");
    expect(hrefs).toContain("/settings/security");
    expect(hrefs.some((h) => h.startsWith("/player/") || h.startsWith("/admin/") || h.startsWith("/coach/"))).toBe(false);
  });

  it("every role can reach announcements, messages and their data settings", () => {
    for (const role of ["PLAYER", "COACH", "ADMIN", "GUARDIAN"]) {
      const hrefs = navFor(role).map((i) => i.href);
      expect(hrefs).toContain("/announcements");
      expect(hrefs).toContain("/messages");
      expect(hrefs).toContain("/settings/account");
    }
  });

  it("unknown role grants nothing", () => {
    expect(capabilitiesFor("SUPPORTER").size).toBe(0);
    expect(navFor("SUPPORTER")).toEqual([]);
  });

  it("keeps items in declared order", () => {
    const items = navFor("ADMIN");
    expect(items[0].href).toBe("/admin/dashboard");
  });

  it("every nav item carries an icon", () => {
    for (const role of ["PLAYER", "COACH", "ADMIN"]) {
      for (const item of navFor(role)) expect(item.icon).toBeTruthy();
    }
  });

  it("primaryNavFor returns at most 4 accessible primary items per role", () => {
    for (const role of ["PLAYER", "COACH", "ADMIN"]) {
      const primary = primaryNavFor(role);
      expect(primary.length).toBeGreaterThan(0);
      expect(primary.length).toBeLessThanOrEqual(4);
      const full = new Set(navFor(role).map((i) => i.href));
      for (const item of primary) {
        expect(item.primary).toBe(true);
        expect(full.has(item.href)).toBe(true);
      }
    }
  });
});
