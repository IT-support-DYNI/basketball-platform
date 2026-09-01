import { test, expect } from "@playwright/test";

import { login } from "./support/helpers";

test("Journey 5 — a player opens their team channel and posts a message", async ({ page }) => {
  await login(page, "marcus.t@example.com"); // senior player

  await page.goto("/messages");
  await page.getByRole("button", { name: /Blazers Seniors channel/ }).click();

  const body = `E2E check-in — everyone set for the weekend? ${Date.now()}`;
  await page.getByPlaceholder(/Write a message/).fill(body);
  await page.getByRole("button", { name: "Send" }).click();

  await expect(page.getByText(body)).toBeVisible();
});
