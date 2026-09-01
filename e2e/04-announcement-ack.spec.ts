import { test, expect } from "@playwright/test";

import { login } from "./support/helpers";

test("Journey 4 — a member reads the club announcements and acknowledges the required one", async ({ page }) => {
  await login(page, "yuki.t@example.com"); // senior player, hasn't acknowledged in the seed

  await page.goto("/announcements");
  const card = page.locator("li").filter({ hasText: "Updated safeguarding policy" });
  await expect(card).toBeVisible();

  await card.getByRole("button", { name: /I've read this/i }).click();
  await expect(card.getByText("Acknowledged")).toBeVisible();
});
