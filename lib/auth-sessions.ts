import { randomBytes } from "crypto";

import { prisma } from "./prisma";
import { hashIp } from "./login-throttle";

/**
 * Revocable device sessions layered over the stateless JWT. `authorize` creates
 * one per sign-in and puts its `tokenId` in the JWT; the jwt callback checks the
 * row on every request, so revoking it (from another device, or on password
 * reset) logs that device out on its next request.
 */

export async function createAuthSession(
  userId: number,
  userAgent: string | null | undefined,
  ip: string | null | undefined,
): Promise<string> {
  const tokenId = randomBytes(24).toString("base64url");
  await prisma.authSession.create({
    data: {
      userId,
      tokenId,
      userAgent: userAgent?.slice(0, 400) ?? null,
      ipHash: hashIp(ip),
    },
  });
  return tokenId;
}

/** Valid = exists and not revoked. Bumps `lastSeenAt` at most every 10 minutes. */
export async function touchAuthSession(tokenId: string): Promise<boolean> {
  const session = await prisma.authSession.findUnique({
    where: { tokenId },
    select: { id: true, revokedAt: true, lastSeenAt: true },
  });
  if (!session || session.revokedAt) return false;

  if (Date.now() - session.lastSeenAt.getTime() > 10 * 60_000) {
    await prisma.authSession
      .update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
      .catch(() => {});
  }
  return true;
}

export async function listAuthSessions(userId: number) {
  return prisma.authSession.findMany({
    where: { userId, revokedAt: null },
    orderBy: { lastSeenAt: "desc" },
    select: { id: true, tokenId: true, userAgent: true, createdAt: true, lastSeenAt: true },
  });
}

export async function revokeAuthSession(userId: number, sessionId: number): Promise<void> {
  await prisma.authSession.updateMany({
    where: { id: sessionId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeOtherAuthSessions(userId: number, keepTokenId: string): Promise<number> {
  const result = await prisma.authSession.updateMany({
    where: { userId, revokedAt: null, NOT: { tokenId: keepTokenId } },
    data: { revokedAt: new Date() },
  });
  return result.count;
}

export async function revokeAllAuthSessions(userId: number): Promise<void> {
  await prisma.authSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
