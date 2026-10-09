import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, ForbiddenError } from "@/lib/api";
import { requireAuth, requireAbility } from "@/lib/authorization";
import { getTenantContext } from "@/lib/tenant";
import { idParam } from "@/lib/contracts/common";
import { updatePlaySchema } from "@/lib/contracts/playbook";
import { isStaff, libraryPlay, playbookPlay, playbookTeamIds, playNotFound } from "@/lib/plays";
import { prisma } from "@/lib/prisma";

async function loadForStaff(session: Session, id: number) {
  const { clubId } = await getTenantContext(session);
  return (await libraryPlay(clubId, id)) ?? playNotFound();
}

/** GET: staff read any play in the club library; players and guardians only
 *  one assigned to their team (anything else is a 404, not a 403, so play
 *  ids can't be probed). */
export const GET = route<{ id: string }>(async (_req, { params, requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const id = idParam.parse(params.id);

  if (isStaff(session)) {
    requireAbility(session, "read", "Play");
    return ok(await loadForStaff(session, id), { requestId });
  }
  if (session.user.role === "PLAYER" || session.user.role === "GUARDIAN") {
    const play = await playbookPlay(await playbookTeamIds(session), id);
    return ok(play ?? playNotFound(), { requestId });
  }
  throw new ForbiddenError();
});

/** PATCH: the play's author (or an admin) edits, archives or restores it. */
export const PATCH = route<{ id: string }>(async (req: NextRequest, { params, requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const play = await loadForStaff(session, idParam.parse(params.id));
  requireAbility(
    session,
    "update",
    "Play",
    { createdByUserId: play.createdByUserId },
    "Only the coach who created this play can change it. You can make your own copy instead.",
  );

  const { archived, courtDiagram, ...rest } = updatePlaySchema.parse(await req.json());
  const updated = await prisma.play.update({
    where: { id: play.id },
    data: {
      ...rest,
      ...(courtDiagram !== undefined ? { courtDiagram: (courtDiagram ?? null) as never } : {}),
      ...(archived !== undefined ? { archivedAt: archived ? new Date() : null } : {}),
    },
    select: { id: true, archivedAt: true },
  });
  return ok(updated, { requestId });
});

/** DELETE archives (players' playbooks stop showing it). Assignments are kept,
 *  so restoring the play puts it straight back where it was. */
export const DELETE = route<{ id: string }>(async (_req, { params, requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const play = await loadForStaff(session, idParam.parse(params.id));
  requireAbility(
    session,
    "delete",
    "Play",
    { createdByUserId: play.createdByUserId },
    "Only the coach who created this play can archive it.",
  );
  await prisma.play.update({ where: { id: play.id }, data: { archivedAt: new Date() } });
  return ok({ archived: true }, { requestId });
});
