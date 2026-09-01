import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { exportAccountData } from "@/lib/account";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET /api/v1/account/export — the caller's own data as a JSON download. */
export const GET = route(async (_req, { requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const userId = Number(session.user.id);

  const data = await exportAccountData(userId);
  await prisma.$transaction((tx) =>
    logAudit(tx, { actorUserId: userId, action: "ACCOUNT_EXPORTED", entityType: "User", entityId: userId }),
  );

  return ok(data, {
    requestId,
    headers: {
      "Content-Disposition": `attachment; filename="dyni-blazers-account-${userId}.json"`,
      "Cache-Control": "no-store",
    },
  });
});
