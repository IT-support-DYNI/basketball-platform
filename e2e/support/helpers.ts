import { PrismaClient } from "@prisma/client";
import { type Page } from "@playwright/test";

/**
 * Direct DB access for E2E setup/teardown and for standing in where a real
 * user would take an out-of-band step (clicking an email verification link).
 * Reuses one client across the serial suite.
 */
export const db = new PrismaClient();

/** Sign in through the real login form and wait until we've left /login. */
export async function login(page: Page, email: string, password = "password123") {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });
}

export async function logout(page: Page) {
  await page.context().clearCookies();
}

/** Stand-in for the applicant clicking the verification link in their email. */
export async function verifyEmail(email: string) {
  await db.user.update({ where: { email }, data: { emailVerifiedAt: new Date() } });
}
