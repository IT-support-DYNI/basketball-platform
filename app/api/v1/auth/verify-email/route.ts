import { NextRequest } from "next/server";

import { route, ok, BadRequestError } from "@/lib/api";
import { verifyEmailSchema } from "@/lib/contracts/auth";
import { consumeAuthToken, InvalidAuthTokenError } from "@/lib/auth-tokens";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

/** POST /api/v1/auth/verify-email — confirm an email address from its link. */
export const POST = route(async (req: NextRequest, { requestId }) => {
  const { token } = verifyEmailSchema.parse(await req.json());

  let userId: number;
  try {
    userId = await consumeAuthToken(token, "EMAIL_VERIFICATION");
  } catch (err) {
    if (err instanceof InvalidAuthTokenError) throw new BadRequestError(err.message);
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { emailVerifiedAt: true } });
    if (!user?.emailVerifiedAt) {
      await tx.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
      await logAudit(tx, {
        actorUserId: userId,
        action: "EMAIL_VERIFIED",
        entityType: "User",
        entityId: userId,
      });
    }
  });

  return ok({ message: "Your email address is confirmed." }, { requestId });
});
