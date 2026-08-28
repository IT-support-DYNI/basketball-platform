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
    expect(hrefs.some((h) => h.startsWith("/player/"))).toBe(false);
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
