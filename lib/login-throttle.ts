import { createHash } from "crypto";

import { prisma } from "./prisma";

/**
 * Brute-force protection (brief §32). After too many failed sign-ins for one
 * email within the window, that email is locked out for a cool-off period —
 * regardless of whether the password later becomes correct — until the window
 * clears. Tracked per submitted email (a real account isn't required).
 *
 * Storage is the LoginAttempt table (no Redis on the free tier). The pure
 * lockout calculation is `computeLockout` so it can be unit-tested without a DB.
 */

export const WINDOW_MINUTES = 15;
export const MAX_FAILURES = 5;

export type LoginAttemptRecord = { success: boolean; createdAt: Date };
export type LockoutState = { locked: boolean; retryAfterMinutes: number };

/** Pure: given the recent attempts for an email (newest first, already filtered
 *  to the window), decide whether it's locked and for how long. */
export function computeLockout(
  recentNewestFirst: LoginAttemptRecord[],
  now: Date = new Date(),
): LockoutState {
  let failures = 0;
  for (const attempt of recentNewestFirst) {
    if (attempt.success) break;
    failures += 1;
  }

  if (failures < MAX_FAILURES) return { locked: false, retryAfterMinutes: 0 };

  const oldestCounted = recentNewestFirst[failures - 1]?.createdAt ?? now;
  const unlockAt = oldestCounted.getTime() + WINDOW_MINUTES * 60_000;
  const retryAfterMinutes = Math.max(1, Math.ceil((unlockAt - now.getTime()) / 60_000));
  return { locked: true, retryAfterMinutes };
}

export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export async function getLockoutState(email: string): Promise<LockoutState> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000);
  const recent = await prisma.loginAttempt.findMany({
    where: { email, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    select: { success: true, createdAt: true },
  });
  return computeLockout(recent);
}

export async function recordLoginAttempt(
  email: string,
  ip: string | null | undefined,
  success: boolean,
): Promise<void> {
  await prisma.loginAttempt.create({ data: { email, ipHash: hashIp(ip), success } });

  // Opportunistic prune (keep a day of history for audit, drop the rest).
  if (Math.random() < 0.05) {
    await prisma.loginAttempt.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60_000) } },
    });
  }
}
