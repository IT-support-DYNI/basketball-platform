import { createHash, randomBytes } from "crypto";
import type { AttendanceStatus } from "@prisma/client";

import { prisma } from "./prisma";

/**
 * Venue check-in: a rotating QR token OR the venue's static PIN. Both are
 * verified server-side — the client is never trusted to say "I'm present".
 */

/** How long a freshly-minted QR token stays valid. The venue screen re-fetches
 *  well within this window so the on-screen code is always fresh. */
const TOKEN_TTL_SECONDS = 45;

/** Grace period after the official start before a check-in counts as LATE. */
const LATE_GRACE_MINUTES = 10;

function hash(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Mint a new rotating token for an event and drop expired ones. Returns the
 *  raw token (goes into the QR payload; only its hash is stored). */
export async function mintQrToken(eventId: number): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(9).toString("base64url"); // 12 chars, plenty for a 45s window
  const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000);

  await prisma.$transaction([
    prisma.qrCheckInToken.deleteMany({ where: { eventId, expiresAt: { lt: new Date() } } }),
    prisma.qrCheckInToken.create({ data: { eventId, tokenHash: hash(token), expiresAt } }),
  ]);

  return { token, expiresAt };
}

/** True if `token` is a currently-valid QR token for `eventId`. */
export async function verifyQrToken(eventId: number, token: string): Promise<boolean> {
  const row = await prisma.qrCheckInToken.findUnique({ where: { tokenHash: hash(token) } });
  return !!row && row.eventId === eventId && row.expiresAt > new Date();
}

/** Constant-ish PIN comparison against the event's venue. */
export function verifyPin(venuePin: string | null | undefined, supplied: string): boolean {
  if (!venuePin) return false;
  const a = Buffer.from(venuePin);
  const b = Buffer.from(supplied);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** PRESENT if the player checked in on time, LATE if past the grace window.
 *  `reference` is the arrival time if set, else the event start. */
export function statusFromCheckIn(checkInAt: Date, reference: Date): AttendanceStatus {
  const cutoff = new Date(reference.getTime() + LATE_GRACE_MINUTES * 60_000);
  return checkInAt > cutoff ? "LATE" : "PRESENT";
}
