import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, BadRequestError } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { mfaCodeSchema } from "@/lib/contracts/auth";
import { verifyTotp } from "@/lib/totp";
import { generateRecoveryCodes, hashRecoveryCodes } from "@/lib/mfa";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/v1/auth/mfa/enable — confirm enrollment with a code from the app.
 * Returns the recovery codes ONCE (they're stored only as hashes).
 */
export const POST = route(async (req: NextRequest, { requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const userId = Number(session.user.id);
  const { code } = mfaCodeSchema.parse(await req.json());

  const mfa = await prisma.userMfa.findUnique({ where: { userId } });
  if (!mfa) throw new BadRequestError("Start setup first.");
  if (mfa.enabledAt) throw new BadRequestError("Two-factor authentication is already on.");

  if (!/^\d{6}$/.test(code.trim()) || !verifyTotp(code.trim(), mfa.secret)) {
    throw new BadRequestError("That code didn't match. Check your authenticator app and try again.");
  }

  const recoveryCodes = generateRecoveryCodes();
  await prisma.$transaction(async (tx) => {
    await tx.userMfa.update({
      where: { userId },
      data: { enabledAt: new Date(), recoveryCodes: await hashRecoveryCodes(recoveryCodes) },
    });
    await logAudit(tx, {
      actorUserId: userId,
      action: "MFA_ENABLED",
      entityType: "User",
      entityId: userId,
    });
  });

  return ok({ enabled: true, recoveryCodes }, { requestId });
});
