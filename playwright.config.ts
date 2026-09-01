import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end coverage of the five Phase 1 critical journeys (build plan W8).
 * Runs against a real build + a seeded database — `npm run prisma:seed` is
 * destructive and deterministic, so every run starts from the same fixtures.
 *
 * Local: `npm run e2e` (builds, seeds, starts the server, runs the specs).
 * CI: the `e2e` job in .github/workflows/ci.yml provides a Postgres service.
 */
export default defineConfig({
  testDir: "./e2e",
  // The specs share one seeded database and some mutate it (approve a
  // registration, post a message). Keep them serial and ordered.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
