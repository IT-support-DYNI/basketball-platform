import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, noContent } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { idParam } from "@/lib/contracts/common";
import { revokeAuthSession } from "@/lib/auth-sessions";

/** DELETE /api/v1/auth/sessions/:id — sign a device out. That device is logged
 *  out on its next request. */
export const DELETE = route<{ id: string }>(async (_req, { params, requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  await revokeAuthSession(Number(session.user.id), idParam.parse(params.id));
  return noContent(requestId);
});
