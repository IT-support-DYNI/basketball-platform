import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, paginated, parseListParams } from "@/lib/api";
import { requireRole } from "@/lib/authorization";
import { listAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/audit — the append-only activity log (admin only).
 * Filters: `?action=`, `?entityType=`, `?actorUserId=`. Standard `?page=&pageSize=`.
 */
export const GET = route(async (req: NextRequest, { requestId }) => {
  requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const sp = req.nextUrl.searchParams;
  const { page, pageSize } = parseListParams(sp);

  const actorRaw = sp.get("actorUserId");
  const { items, total } = await listAuditLog({
    page,
    pageSize,
    action: sp.get("action"),
    entityType: sp.get("entityType"),
    actorUserId: actorRaw ? Number(actorRaw) : null,
  });

  return paginated(items, { page, pageSize, total }, requestId);
});
