import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, noContent, NotFoundError } from "@/lib/api";
import { requireRole, requireTeamAccess } from "@/lib/authorization";
import { idParam } from "@/lib/contracts/common";
import { updateSquadSchema } from "@/lib/contracts/organisation";
import { prisma } from "@/lib/prisma";

export const PATCH = route<{ id: string; squadId: string }>(async (req: NextRequest, { params, requestId }) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const teamId = idParam.parse(params.id);
  requireTeamAccess(session, teamId);

  const squadId = idParam.parse(params.squadId);
  const squad = await prisma.squad.findFirst({ where: { id: squadId, teamId } });
  if (!squad) throw new NotFoundError("That squad wasn't found.");

  const body = updateSquadSchema.parse(await req.json());
  const updated = await prisma.squad.update({
    where: { id: squadId },
    data: { name: body.name, ageGroup: body.ageGroup },
  });
  return ok(updated, { requestId });
});

/** DELETE — remove a squad. Members are un-squadded (SET NULL), not removed
 *  from the roster. */
export const DELETE = route<{ id: string; squadId: string }>(async (_req, { params, requestId }) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const teamId = idParam.parse(params.id);
  requireTeamAccess(session, teamId);

  const squadId = idParam.parse(params.squadId);
  const squad = await prisma.squad.findFirst({ where: { id: squadId, teamId } });
  if (!squad) throw new NotFoundError("That squad wasn't found.");

  await prisma.squad.delete({ where: { id: squadId } });
  return noContent(requestId);
});
