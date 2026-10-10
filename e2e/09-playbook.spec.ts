import { test, expect } from "@playwright/test";

import { db, login, logout } from "./support/helpers";

const PLAY = "E2E Horns entry";

test.afterAll(async () => {
  await db.play.deleteMany({ where: { name: PLAY } });
});

test("Journey 8: a coach draws a play, adds it to U16, and only U16 players and their guardians see it", async ({ page }) => {
  // Coach: draw and save the play
  await login(page, "coach@example.com");
  await page.goto("/coach/plays/new");
  await page.getByLabel("Name").fill(PLAY);
  await page.getByLabel("Type").selectOption("OFFENCE");
  await page.getByLabel("Notes for players").fill("Call HORNS. 4 and 5 up to the elbows, 1 picks a side.");

  const svg = page.locator('svg[role="img"]');
  const toolbar = page.getByRole("toolbar", { name: "Court diagram tools" });
  await toolbar.getByRole("button", { name: "Player", exact: true }).click();
  // Centre the court first: on a short screen its lower half is below the
  // fold, and a mouse click there lands on nothing.
  await svg.evaluate((el) => el.scrollIntoView({ block: "center" }));
  const box = (await svg.boundingBox())!;
  await page.mouse.click(box.x + 0.5 * box.width, box.y + 0.5 * box.height);
  await expect(svg).toHaveAttribute("aria-label", /1 player/i);

  await page.getByRole("button", { name: "Create play" }).click();
  await page.waitForURL(/\/coach\/plays\/\d+$/);
  const playUrl = new URL(page.url());
  const playId = playUrl.pathname.split("/").pop();

  // Coach: put it on U16 only
  await page.getByRole("checkbox", { name: "Blazers U16" }).click();
  await page.getByRole("button", { name: "Save teams" }).click();
  // The toast is also announced to screen readers, so the text appears twice.
  await expect(page.getByText(/Added to 1 team/).first()).toBeVisible();

  // U16 player: sees it in the playbook, with the diagram, and was notified
  await logout(page);
  await login(page, "player1@example.com");
  await page.goto("/player/playbook");
  await page.getByRole("link", { name: new RegExp(PLAY) }).click();
  await expect(page.getByRole("heading", { name: PLAY })).toBeVisible();
  await expect(page.locator('svg[role="img"]')).toHaveAttribute("aria-label", /1 player/i);
  await expect(page.getByText("Call HORNS.", { exact: false })).toBeVisible();
  const player1 = await db.user.findUniqueOrThrow({ where: { email: "player1@example.com" } });
  expect(await db.notification.count({ where: { userId: player1.id, type: "NEW_PLAY" } })).toBeGreaterThan(0);

  // Seniors player: not in their playbook, and the direct link is a 404
  await logout(page);
  await login(page, "marcus.t@example.com");
  await page.goto("/player/playbook");
  await expect(page.getByRole("link", { name: new RegExp(PLAY) })).toHaveCount(0);
  await page.goto(`/player/playbook/${playId}`);
  await expect(page.getByText(/could not be found|not found/i).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: PLAY })).toHaveCount(0);
  const api = await page.request.get(`/api/v1/plays/${playId}`);
  expect(api.status()).toBe(404);

  // Guardian of a U16 player: sees it too
  await logout(page);
  await login(page, "guardian@example.com");
  await page.goto("/guardian/playbook");
  await expect(page.getByRole("link", { name: new RegExp(PLAY) })).toBeVisible();
});
