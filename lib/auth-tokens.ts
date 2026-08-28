import { createHash, randomBytes } from "crypto";
import type { AuthTokenType, Prisma } from "@prisma/client";

import { prisma } from "./prisma";

/**
 * Single-use, expiring tokens for email verification and password reset.
 * The raw token is returned once (to build the emailed link) and never stored —
 * only its SHA-256 hash goes in the database.
 */

const TTL_MINUTES: Record<AuthTokenType, number> = {
  EMAIL_VERIFICATION: 60 * 24, // 24 hours
  PASSWORD_RESET: 30, // 30 minutes
};

function hash(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Create a token for `userId`, invalidating any earlier unused token of the
 *  same type. Returns the raw token for the URL. */
export async function issueAuthToken(userId: number, type: AuthTokenType): Promise<string> {
  const raw = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL_MINUTES[type] * 60_000);

  await prisma.$transaction([
    prisma.authToken.updateMany({
      where: { userId, type, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.authToken.create({ data: { userId, type, tokenHash: hash(raw), expiresAt } }),
  ]);

  return raw;
}

export class InvalidAuthTokenError extends Error {
  constructor(message = "This link is invalid or has expired. Request a new one.") {
    super(message);
    this.name = "InvalidAuthTokenError";
  }
}

/**
 * Validate a raw token and mark it used, in one atomic step. Returns the
 * userId. Throws InvalidAuthTokenError if it doesn't exist, is the wrong type,
 * is expired, or was already used.
 */
export async function consumeAuthToken(raw: string, type: AuthTokenType): Promise<number> {
  const tokenHash = hash(raw);

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const token = await tx.authToken.findUnique({ where: { tokenHash } });
    if (!token || token.type !== type || token.usedAt || token.expiresAt < new Date()) {
      throw new InvalidAuthTokenError();
    }
    await tx.authToken.update({ where: { id: token.id }, data: { usedAt: new Date() } });
    return token.userId;
  });
}
