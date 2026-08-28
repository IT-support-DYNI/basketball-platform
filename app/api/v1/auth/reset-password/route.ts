import { NextRequest } from "next/server";

import { route, ok, BadRequestError } from "@/lib/api";
import { resetPasswordSchema } from "@/lib/contracts/auth";
import { consumeAuthToken, InvalidAuthTokenError } from "@/lib/auth-tokens";
import { hashPassword } from "@/lib/password";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/v1/auth/reset-password — consume a reset token and set a new
 * password. Also clears `mustChangePassword` and invalidates every other
 * outstanding reset token for that user.
 */
export const POST = route(async (req: NextRequest, { requestId }) => {
  const { token, newPassword } = resetPasswordSchema.parse(await req.json());

  let userId: number;
  try {
    userId = await consumeAuthToken(token, "PASSWORD_RESET");
  } catch (err) {
    if (err instanceof InvalidAuthTokenError) throw new BadRequestError(err.message);
    throw err;
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
    });
    await tx.authToken.updateMany({
      where: { userId, type: "PASSWORD_RESET", usedAt: null },
      data: { usedAt: new Date() },
    });
    // A reset is also a "log everyone out" — any session on the old password
    // (including an attacker's) is revoked.
    await tx.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await logAudit(tx, {
      actorUserId: userId,
      action: "PASSWORD_RESET_COMPLETED",
      entityType: "User",
      entityId: userId,
    });
  });

  return ok({ message: "Your password has been reset. You can sign in now." }, { requestId });
});
