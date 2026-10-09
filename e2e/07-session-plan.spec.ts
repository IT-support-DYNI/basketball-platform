import { test, expect } from "@playwright/test";

import { login, logout } from "./support/helpers";

test("Journey 6 — a coach links a plan to a session and the player sees it", async ({ page }) => {
  // --- the coach opens the linked training session ---
  await login(page, "coach@example.com");
  await page.goto("/coach/training");
  await page.getByRole("button", { name: "agenda" }).click();
  await page.getByRole("button", { name: /U16 Practice/ }).first().click();

  const coachDialog = page.getByRole("dialog");
  await expect(coachDialog.getByText("Session plan")).toBeVisible();
  await expect(coachDialog.getByRole("link", { name: /spacing & closeouts/ })).toBeVisible();

  // The plan's "Closeouts" block links a library drill with a diagram and has
  // none of its own: the builder shows the drill's diagram, ready to customise.
  await coachDialog.getByRole("link", { name: /spacing & closeouts/ }).click();
  await expect(page.getByText(/Court diagram from the drill .Closeout & mirror./)).toBeVisible();

  // --- a player on that team sees the published plan for the same session ---
  // Signing in again without logging out first would just bounce off /login —
  // middleware redirects an already-authenticated visitor straight to their
  // dashboard instead of showing the form (see middleware.ts).
  await logout(page);
  await login(page, "player1@example.com");
  await page.goto("/player/training");
  await page.getByRole("button", { name: "agenda" }).click();
  await page.getByRole("button", { name: /U16 Practice/ }).first().click();

  const playerDialog = page.getByRole("dialog");
  await expect(playerDialog.getByText(/What.s planned/)).toBeVisible();
  await expect(playerDialog.getByText(/min/).first()).toBeVisible();
  // ...including the linked drill's diagram, which players never saw before.
  await expect(playerDialog.getByText("Drill: Closeout & mirror")).toBeVisible();
  await expect(playerDialog.locator('svg[role="img"]').first()).toHaveAttribute("aria-label", /2 movement arrows/i);
});
