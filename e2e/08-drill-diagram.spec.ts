import { test, expect } from "@playwright/test";

import { db, login } from "./support/helpers";

test.afterAll(async () => {
  await db.drill.deleteMany({ where: { name: "E2E closeout drill" } });
});

test("Journey 7 — a coach draws a court diagram on a drill and it renders read-only", async ({ page }) => {
  await login(page, "coach@example.com");
  await page.goto("/coach/drills/new");

  await page.getByLabel("Name").fill("E2E closeout drill");
  await page.getByLabel("Category").selectOption("DEFENSE");

  const svg = page.locator('svg[role="img"]');
  await svg.scrollIntoViewIfNeeded();
  const box = (await svg.boundingBox())!;
  const at = (nx: number, ny: number) => ({ x: box.x + nx * box.width, y: box.y + ny * box.height });
  const toolbar = page.getByRole("toolbar", { name: "Court diagram tools" });

  await toolbar.getByRole("button", { name: "Player", exact: true }).click();
  let pt = at(0.5, 0.35);
  await page.mouse.click(pt.x, pt.y);

  await toolbar.getByRole("button", { name: "Defender" }).click();
  pt = at(0.5, 0.16);
  await page.mouse.click(pt.x, pt.y);

  await toolbar.getByRole("button", { name: "Movement →" }).click();
  let a = at(0.5, 0.18);
  await page.mouse.click(a.x, a.y);
  a = at(0.72, 0.4);
  await page.mouse.click(a.x, a.y);

  await expect(svg).toHaveAttribute("aria-label", /1 player.*1 defender.*1 movement arrow/i);

  await page.getByRole("button", { name: "Add drill" }).click();
  await page.waitForURL(/\/coach\/drills\/\d+$/);

  // read view: the "Court setup" heading + the diagram, still describing the same content
  await expect(page.getByRole("heading", { name: "Court setup" })).toBeVisible();
  await expect(page.locator('svg[role="img"]')).toHaveAttribute("aria-label", /1 player.*1 defender.*1 movement arrow/i);
});
