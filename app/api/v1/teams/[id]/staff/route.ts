import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, created, ConflictError, BadRequestError } from "@/lib/api";
import { requireAuth, requireRole, requireTeamAccess } from "@/lib/authorization";
import { idParam } from "@/lib/contracts/common";
import { assignStaffSchema } from "@/lib/contracts/organisation";
import { getActiveSeason } from "@/lib/season";
import { getTenantContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

/** GET — a team's staff (all seasons; current-season ones flagged). */
export const GET = route<{ id: string }>(async (_req, { params, requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const teamId = idParam.parse(params.id);
  requireTeamAccess(session, teamId);

  const staff = await prisma.staffAssignment.findMany({
    where: { teamId },
    orderBy: { role: "asc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      season: { select: { id: true, name: true } },
    },
  });
  return ok(staff, { requestId });
});

/** POST — assign a staff member (admin). */
export const POST = route<{ id: string }>(async (req: NextRequest, { params, requestId }) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const teamId = idParam.parse(params.id);
  requireTeamAccess(session, teamId);

  const body = assignStaffSchema.parse(await req.json());
  const ctx = await getTenantContext(session);
  const seasonId = body.seasonId === undefined ? (await getActiveSeason(ctx.clubId)).id : body.seasonId;

  const user = await prisma.user.findUnique({ where: { id: body.userId }, select: { id: true } });
  if (!user) throw new BadRequestError("That user wasn't found.");

  try {
    const assignment = await prisma.staffAssignment.create({
      data: { userId: body.userId, teamId, role: body.role, seasonId },
    });
    return created(assignment, requestId);
  } catch {
    throw new ConflictError("That person already holds that role on this team for the season.");
  }
});
