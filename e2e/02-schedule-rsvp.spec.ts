import { test, expect } from "@playwright/test";

import { login } from "./support/helpers";

test("Journey 2 — a player finds an upcoming match and RSVPs", async ({ page }) => {
  await login(page, "leah.b@example.com"); // U16 player, fully onboarded, no seeded RSVP to this match

  await page.goto("/player/training");
  await page.getByRole("button", { name: "agenda" }).click();
  await page.getByRole("button", { name: /Northgate Falcons/ }).click();

  const dialog = page.getByRole("dialog");
  const going = dialog.getByRole("button", { name: "Going", exact: true });
  await expect(dialog.getByText("Your RSVP")).toBeVisible();
  await going.click();
  await expect(going).toHaveClass(/flame/);

  // it persists across a reload
  await page.reload();
  await page.getByRole("button", { name: "agenda" }).click();
  await page.getByRole("button", { name: /Northgate Falcons/ }).click();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Going", exact: true })).toHaveClass(/flame/);
});
