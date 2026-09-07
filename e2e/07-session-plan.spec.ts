import { test, expect } from "@playwright/test";

import { login } from "./support/helpers";

test("Journey 6 — a coach links a plan to a session and the player sees it", async ({ page }) => {
  // --- the coach opens the linked training session ---
  await login(page, "coach@example.com");
  await page.goto("/coach/training");
  await page.getByRole("button", { name: "agenda" }).click();
  await page.getByRole("button", { name: /U16 Practice/ }).first().click();

  const coachDialog = page.getByRole("dialog");
  await expect(coachDialog.getByText("Session plan")).toBeVisible();
  await expect(coachDialog.getByRole("link", { name: /spacing & closeouts/ })).toBeVisible();

  // --- a player on that team sees the published plan for the same session ---
  await login(page, "player1@example.com");
  await page.goto("/player/training");
  await page.getByRole("button", { name: "agenda" }).click();
  await page.getByRole("button", { name: /U16 Practice/ }).first().click();

  const playerDialog = page.getByRole("dialog");
  await expect(playerDialog.getByText(/What.s planned/)).toBeVisible();
  await expect(playerDialog.getByText(/min/).first()).toBeVisible();
});
