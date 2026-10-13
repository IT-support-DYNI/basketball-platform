import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok } from "@/lib/api";
import { requireRole } from "@/lib/authorization";
import { idParam } from "@/lib/contracts/common";
import { updateSeasonSchema } from "@/lib/contracts/organisation";
import { requireSeason } from "@/lib/season";
import { assertSameClub, getTenantContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export const PATCH = route<{ id: string }>(async (req: NextRequest, { params, requestId }) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const ctx = await getTenantContext(session);
  const seasonId = idParam.parse(params.id);

  const existing = await requireSeason(seasonId);
  assertSameClub(existing.clubId, ctx);

  const body = updateSeasonSchema.parse(await req.json());

  const season = await prisma.$transaction(async (tx) => {
    if (body.isActive) {
      await tx.season.updateMany({
        where: { clubId: ctx.clubId, NOT: { id: seasonId } },
        data: { isActive: false },
      });
    }
    return tx.season.update({
      where: { id: seasonId },
      data: {
        name: body.name,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        isActive: body.isActive,
      },
    });
  });

  return ok(season, { requestId });
});
