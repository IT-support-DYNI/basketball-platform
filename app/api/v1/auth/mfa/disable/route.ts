import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, noContent, BadRequestError } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { mfaCodeSchema } from "@/lib/contracts/auth";
import { verifyMfaChallenge } from "@/lib/mfa";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

/** POST /api/v1/auth/mfa/disable — turn MFA off, confirmed with a current code
 *  (TOTP or a recovery code). */
export const POST = route(async (req: NextRequest, { requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const userId = Number(session.user.id);
  const { code } = mfaCodeSchema.parse(await req.json());

  const mfa = await prisma.userMfa.findUnique({ where: { userId }, select: { enabledAt: true } });
  if (!mfa?.enabledAt) throw new BadRequestError("Two-factor authentication isn't on.");

  if (!(await verifyMfaChallenge(userId, code))) {
    throw new BadRequestError("That code didn't match.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.userMfa.delete({ where: { userId } });
    await logAudit(tx, {
      actorUserId: userId,
      action: "MFA_DISABLED",
      entityType: "User",
      entityId: userId,
    });
  });

  return noContent(requestId);
});
