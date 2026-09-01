import { test, expect } from "@playwright/test";

import { db, login } from "./support/helpers";

let eventId: number;

test.beforeAll(async () => {
  const [team, venue, coach] = await Promise.all([
    db.team.findFirstOrThrow({ where: { name: "Blazers U16" } }),
    db.venue.findFirstOrThrow({ where: { name: { contains: "Riverside" } } }),
    db.user.findFirstOrThrow({ where: { email: "coach@example.com" } }),
  ]);
  const ev = await db.event.create({
    data: {
      teamId: team.id,
      type: "TRAINING",
      title: "E2E live check-in session",
      venueId: venue.id,
      startAt: new Date(Date.now() - 10 * 60_000),
      endAt: new Date(Date.now() + 90 * 60_000),
      createdByUserId: coach.id,
    },
  });
  eventId = ev.id;
});

test.afterAll(async () => {
  await db.event.delete({ where: { id: eventId } }).catch(() => {});
});

test("Journey 3 — a player checks in to a live session with the venue PIN", async ({ page }) => {
  await login(page, "player1@example.com"); // Priya, on Blazers U16

  await page.goto(`/checkin/${eventId}`);
  await page.getByLabel(/Venue PIN/i).fill("4827"); // Riverside Sports Centre PIN from the seed
  await page.getByRole("button", { name: "Check in" }).click();

  await expect(page.getByText(/Checked in at/i)).toBeVisible();
});
