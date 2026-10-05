import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, BadRequestError } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { revokeOtherAuthSessions } from "@/lib/auth-sessions";
import { setPasswordSchema } from "@/lib/contracts/user";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

/**
 * Any authenticated user sets their own password — the forced first-login
 * change (temporary password, `mustChangePassword`) and voluntary changes.
 *
 * A voluntary change needs the current password: otherwise anyone holding a
 * live session (an unlocked shared device, a stolen cookie) could lock the
 * owner out. Every other device is signed out once the password changes.
 */
export const POST = route(async (req: NextRequest) => {
  const session = requireAuth(await getServerSession(authOptions));
  const body = setPasswordSchema.parse(await req.json());
  const userId = Number(session.user.id);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { passwordHash: true, mustChangePassword: true },
  });

  if (!user.mustChangePassword) {
    const currentOk =
      !!body.currentPassword && !!user.passwordHash && (await verifyPassword(body.currentPassword, user.passwordHash));
    if (!currentOk) throw new BadRequestError("Your current password is incorrect.");
  }

  const passwordHash = await hashPassword(body.newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: false },
  });
  if (session.user.sid) await revokeOtherAuthSessions(userId, session.user.sid);

  return NextResponse.json({ ok: true });
});
