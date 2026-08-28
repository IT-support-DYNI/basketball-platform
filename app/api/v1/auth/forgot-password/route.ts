import { NextRequest } from "next/server";

import { route, ok } from "@/lib/api";
import { forgotPasswordSchema } from "@/lib/contracts/auth";
import { issueAuthToken } from "@/lib/auth-tokens";
import { sendMail } from "@/lib/mail";
import { passwordResetMessage } from "@/lib/mail/templates";
import { baseUrl } from "@/lib/base-url";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/v1/auth/forgot-password — always returns 200 with the same body,
 * whether or not the email matches an account, so it can't be used to
 * enumerate registered addresses. If it does match a password account, a
 * reset link is emailed.
 */
export const POST = route(async (req: NextRequest, { requestId }) => {
  const { email } = forgotPasswordSchema.parse(await req.json());
  const normalised = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: normalised } });
  if (user?.passwordHash && user.isActive) {
    const token = await issueAuthToken(user.id, "PASSWORD_RESET");
    const url = `${baseUrl()}/reset-password?token=${token}`;
    await sendMail(passwordResetMessage(user.email, user.name, url));
  }

  return ok(
    { message: "If that email has an account, a reset link is on its way." },
    { requestId },
  );
});
