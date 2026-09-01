import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import { login } from "./support/helpers";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function scan(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();

  const report = violations.flatMap((v) =>
    v.nodes.map((n) => `[${v.impact}] ${v.id} — ${n.target.join(" ")}\n    ${n.failureSummary?.split("\n").slice(1).join(" ").trim()}`),
  );
  expect(report, `${path}:\n${report.join("\n")}`).toHaveLength(0);
}

test.describe("accessibility — no WCAG 2.1 A/AA violations", () => {
  test("public pages", async ({ page }) => {
    await scan(page, "/login");
    await scan(page, "/register");
  });

  test("player surfaces", async ({ page }) => {
    await login(page, "player1@example.com");
    await scan(page, "/player/dashboard");
    await scan(page, "/player/training");
    await scan(page, "/announcements");
    await scan(page, "/messages");
    await scan(page, "/settings/account");
    await scan(page, "/settings/security");
    await scan(page, "/notifications");
  });

  test("coach surfaces", async ({ page }) => {
    await login(page, "coach@example.com");
    await scan(page, "/coach/dashboard");
    await scan(page, "/coach/drills");
    await scan(page, "/coach/drills/new");
    await scan(page, "/coach/training/plans");
    await scan(page, "/coach/training/plans/new");
  });

  test("admin surfaces", async ({ page }) => {
    await login(page, "admin@example.com");
    await scan(page, "/admin/dashboard");
    await scan(page, "/admin/registrations");
    await scan(page, "/admin/audit");
  });
});
