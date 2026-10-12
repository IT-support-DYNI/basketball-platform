import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok } from "@/lib/api";
import { requireAbility, requireRole } from "@/lib/authorization";
import { getTenantContext } from "@/lib/tenant";
import { idParam } from "@/lib/contracts/common";
import { setPlayAssignmentsSchema } from "@/lib/contracts/playbook";
import { libraryPlay, playNotFound, setPlayAssignments } from "@/lib/plays";

/**
 * PUT /api/v1/plays/:id/assignments  { teamIds }
 * Sets which of the caller's teams have this play. Any coach may put any play
 * from the shared library on a team they coach; teams they don't coach are
 * rejected, and other coaches' assignments are left untouched.
 */
export const PUT = route<{ id: string }>(async (req: NextRequest, { params, requestId }) => {
  const session = requireRole(await getServerSession(authOptions), ["COACH", "ADMIN"]);
  requireAbility(session, "read", "Play");
  const { clubId } = await getTenantContext(session);
  const play = (await libraryPlay(clubId, idParam.parse(params.id))) ?? playNotFound();
  const { teamIds } = setPlayAssignmentsSchema.parse(await req.json());

  const result = await setPlayAssignments(session, clubId, play, teamIds);
  return ok(result, { requestId });
});
