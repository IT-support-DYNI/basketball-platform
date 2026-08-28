import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, created } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/authorization";
import { createSeasonSchema } from "@/lib/contracts/organisation";
import { getTenantContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

/** GET — the club's seasons, newest first. */
export const GET = route(async (_req, { requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const ctx = await getTenantContext(session);

  const seasons = await prisma.season.findMany({
    where: { clubId: ctx.clubId },
    orderBy: { startDate: "desc" },
    include: { _count: { select: { memberships: true, squads: true } } },
  });
  return ok(seasons, { requestId });
});

/** POST — create a season (admin). Marking it active deactivates the others. */
export const POST = route(async (req: NextRequest, { requestId }) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const ctx = await getTenantContext(session);
  const body = createSeasonSchema.parse(await req.json());

  const season = await prisma.$transaction(async (tx) => {
    if (body.isActive) {
      await tx.season.updateMany({ where: { clubId: ctx.clubId }, data: { isActive: false } });
    }
    return tx.season.create({
      data: {
        clubId: ctx.clubId,
        name: body.name,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        isActive: body.isActive ?? false,
      },
    });
  });

  return created(season, requestId);
});
