import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { issueAuthToken } from "@/lib/auth-tokens";
import { sendMail } from "@/lib/mail";
import { verifyEmailMessage } from "@/lib/mail/templates";
import { baseUrl } from "@/lib/base-url";
import { prisma } from "@/lib/prisma";

/** POST /api/v1/auth/resend-verification — re-send the confirmation email to
 *  the signed-in user, if they're not already verified. */
export const POST = route(async (_req, { requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const user = await prisma.user.findUnique({ where: { id: Number(session.user.id) } });

  if (user && !user.emailVerifiedAt) {
    const token = await issueAuthToken(user.id, "EMAIL_VERIFICATION");
    await sendMail(verifyEmailMessage(user.email, user.name, `${baseUrl()}/verify-email?token=${token}`));
  }

  return ok({ message: "If your email isn't confirmed yet, a new link is on its way." }, { requestId });
});
