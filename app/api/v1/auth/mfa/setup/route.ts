import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, ConflictError } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { generateSecret, totpAuthUri } from "@/lib/totp";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/v1/auth/mfa/setup — begin enrollment. Generates a fresh secret
 * (replacing any half-finished one) and returns it plus the otpauth URI to add
 * to an authenticator app. MFA is not active until /mfa/enable confirms a code.
 */
export const POST = route(async (_req, { requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const userId = Number(session.user.id);

  const existing = await prisma.userMfa.findUnique({ where: { userId }, select: { enabledAt: true } });
  if (existing?.enabledAt) {
    throw new ConflictError("Two-factor authentication is already on. Turn it off first to re-enrol.");
  }

  const secret = generateSecret();
  await prisma.userMfa.upsert({
    where: { userId },
    create: { userId, secret, recoveryCodes: [] },
    update: { secret, enabledAt: null, recoveryCodes: [] },
  });

  return ok(
    { secret, otpauthUri: totpAuthUri(secret, session.user.email ?? `user-${userId}`) },
    { requestId },
  );
});
