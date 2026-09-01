import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, noContent, NotFoundError } from "@/lib/api";
import { requireAuth, requireAbility } from "@/lib/authorization";
import { getTenantContext } from "@/lib/tenant";
import { updateDrillSchema } from "@/lib/contracts/training";
import { drillById } from "@/lib/drills";
import { prisma } from "@/lib/prisma";

async function load(session: Awaited<ReturnType<typeof requireAuth>>, idParam: string) {
  const { clubId } = await getTenantContext(session);
  const drill = await drillById(clubId, Number(idParam));
  if (!drill) throw new NotFoundError("That drill wasn't found.");
  return drill;
}

export const GET = route<{ id: string }>(async (_req, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  requireAbility(session, "read", "Drill");
  return ok(await load(session, params.id));
});

/** PATCH — any coach can edit a drill in the shared library. */
export const PATCH = route<{ id: string }>(async (req: NextRequest, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const drill = await load(session, params.id);
  requireAbility(session, "update", "Drill");

  const body = updateDrillSchema.parse(await req.json());
  const { archived, courtDiagram, ...rest } = body;

  const updated = await prisma.drill.update({
    where: { id: drill.id },
    data: {
      ...rest,
      ...(courtDiagram !== undefined ? { courtDiagram: courtDiagram as never } : {}),
      ...(archived !== undefined ? { archivedAt: archived ? new Date() : null } : {}),
    },
  });
  return ok(updated);
});

/** DELETE — the author (or an admin) only; others archive instead. */
export const DELETE = route<{ id: string }>(async (_req, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const drill = await load(session, params.id);
  requireAbility(
    session,
    "delete",
    "Drill",
    { createdByUserId: drill.createdByUserId },
    "Only the coach who added this drill can delete it — you can archive it instead.",
  );
  await prisma.drill.delete({ where: { id: drill.id } });
  return noContent();
});
