import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, BadRequestError, ForbiddenError, ConflictError } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { deleteAccountSchema } from "@/lib/contracts/account";
import { verifyPassword } from "@/lib/password";
import { anonymiseAccount, activeAdminCount, canDeleteOwnAccount } from "@/lib/account";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/v1/account — the caller erases their own account. Re-authenticated
 * with the current password; the personal data is scrubbed and operational
 * records (attendance, evaluations, messages) are kept anonymised. Irreversible.
 */
export const DELETE = route(async (req: NextRequest) => {
  const session = requireAuth(await getServerSession(authOptions));
  const userId = Number(session.user.id);
  const { password } = deleteAccountSchema.parse(await req.json());

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { role: true, passwordHash: true },
  });
  if (!user.passwordHash) {
    throw new ForbiddenError("This account has no password set. Ask a club administrator to remove it.");
  }
  if (!(await verifyPassword(password, user.passwordHash))) {
    throw new BadRequestError("That password is incorrect.");
  }

  const eligibility = canDeleteOwnAccount(user.role, await activeAdminCount());
  if (!eligibility.ok) throw new ConflictError(eligibility.reason);

  await anonymiseAccount(userId);
  return ok({ deleted: true });
});
