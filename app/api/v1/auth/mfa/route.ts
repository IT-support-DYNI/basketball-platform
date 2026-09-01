import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

/** GET /api/v1/auth/mfa — the caller's MFA status. */
export const GET = route(async (_req, { requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const mfa = await prisma.userMfa.findUnique({
    where: { userId: Number(session.user.id) },
    select: { enabledAt: true, recoveryCodes: true },
  });

  return ok(
    {
      enabled: mfa?.enabledAt != null,
      recoveryCodesRemaining: mfa?.recoveryCodes.length ?? 0,
      recommended: session.user.role === "ADMIN",
    },
    { requestId },
  );
});
