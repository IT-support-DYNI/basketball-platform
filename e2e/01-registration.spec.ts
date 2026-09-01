import { test, expect } from "@playwright/test";

import { db, login, logout, verifyEmail } from "./support/helpers";

const APPLICANT = "e2e.applicant@example.com";
const PASSWORD = "e2e-password-123";

test.beforeAll(async () => {
  await db.registrationDraft.deleteMany({ where: { email: APPLICANT } });
  const existing = await db.user.findUnique({ where: { email: APPLICANT }, include: { playerProfile: true } });
  if (existing) {
    if (existing.playerProfile) await db.playerProfile.delete({ where: { id: existing.playerProfile.id } });
    await db.user.delete({ where: { id: existing.id } });
  }
});

test("Journey 1 — an applicant registers, an admin approves, and they get in", async ({ page }) => {
  // --- the applicant fills the multi-step registration ---
  await page.goto("/register");
  await page.getByLabel(/Your email/).fill(APPLICANT);
  await page.getByRole("button", { name: "Start" }).click();

  await page.getByLabel("Full name").fill("Erin Example");
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Date of birth").fill("2000-05-20");
  await page.getByRole("button", { name: "Continue" }).click();

  const teamSelect = page.getByLabel("Team");
  const seniorsValue = await teamSelect
    .locator("option", { hasText: "Blazers Seniors" })
    .getAttribute("value");
  await teamSelect.selectOption(seniorsValue!);
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("button", { name: "Submit registration" }).click();
  await page.waitForURL("**/registration-status**");
  await expect(page.getByRole("heading", { name: /under review/i })).toBeVisible();

  // stands in for the applicant clicking the verification link in their email
  await verifyEmail(APPLICANT);

  // --- an admin approves them ---
  await logout(page);
  await login(page, "admin@example.com");
  await page.goto("/admin/registrations");

  const card = page.locator("div.rounded-2xl").filter({ hasText: APPLICANT });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText(APPLICANT)).toBeHidden();

  // --- the applicant signs in: past the holding page, now the consent gate ---
  await logout(page);
  await login(page, APPLICANT, PASSWORD);
  await page.waitForURL("**/consent**");

  for (const box of await page.getByRole("checkbox", { name: "I accept" }).all()) {
    await box.check();
  }
  await page.getByRole("button", { name: /Accept .*selected/ }).click();

  // --- and lands in the app proper ---
  await page.waitForURL("**/player/dashboard**");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
});
