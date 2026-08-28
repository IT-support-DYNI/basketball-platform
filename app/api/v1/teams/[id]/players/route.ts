import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, created, ConflictError } from "@/lib/api";
import { requireAuth, requireRole, requireTeamAccess, canViewPlayerContactDetails } from "@/lib/authorization";
import { idParam } from "@/lib/contracts/common";
import { addPlayerToTeamSchema } from "@/lib/contracts/team";
import { generateTempPassword, hashPassword } from "@/lib/password";
import { getActiveSeason } from "@/lib/season";
import { getTenantContext } from "@/lib/tenant";
import { addToRoster } from "@/lib/roster";
import { prisma } from "@/lib/prisma";

/**
 * GET — the team's roster for a season (defaults to the active one; pass
 * `?seasonId=` for a past season). Reads TeamMembership, not the deprecated
 * PlayerProfile.teamId.
 */
export const GET = route<{ id: string }>(async (req: NextRequest, { params, requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const teamId = idParam.parse(params.id);
  requireTeamAccess(session, teamId);

  const ctx = await getTenantContext(session);
  const seasonParam = req.nextUrl.searchParams.get("seasonId");
  const seasonId = seasonParam ? Number(seasonParam) : (await getActiveSeason(ctx.clubId)).id;

  const memberships = await prisma.teamMembership.findMany({
    where: { teamId, seasonId },
    orderBy: [{ status: "asc" }, { jerseyNumber: "asc" }],
    include: {
      squad: { select: { id: true, name: true } },
      player: {
        include: { user: { select: { id: true, name: true, email: true, isActive: true } } },
      },
    },
  });

  const canSeeContact =
    memberships.length > 0 && canViewPlayerContactDetails(session, { id: memberships[0].player.id, teamIds: [teamId] });

  const roster = memberships.map((m) => ({
    membershipId: m.id,
    status: m.status,
    jerseyNumber: m.jerseyNumber,
    position: m.position,
    secondaryPosition: m.secondaryPosition,
    squad: m.squad,
    joinedAt: m.joinedAt,
    leftAt: m.leftAt,
    player: {
      id: m.player.id,
      user: m.player.user,
      photoUrl: m.player.photoUrl,
      dateOfBirth: m.player.dateOfBirth,
      contactPhone: canSeeContact ? m.player.contactPhone : undefined,
      guardianName: canSeeContact ? m.player.guardianName : undefined,
      guardianContact: canSeeContact ? m.player.guardianContact : undefined,
    },
  }));

  return ok({ teamId, seasonId, roster }, { requestId });
});

/**
 * POST — provision a new player account AND add them to this team's roster for
 * the active season. (Adding an *existing* player to a roster is a follow-up
 * endpoint; today every path that needs it also creates the account.)
 */
export const POST = route<{ id: string }>(async (req: NextRequest, { params, requestId }) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN", "COACH"]);
  const teamId = idParam.parse(params.id);
  requireTeamAccess(session, teamId);

  const body = addPlayerToTeamSchema.parse(await req.json());
  const email = body.email.trim().toLowerCase();

  if (await prisma.user.findUnique({ where: { email } })) {
    throw new ConflictError("A user with that email already exists.");
  }

  const ctx = await getTenantContext(session);
  const season = await getActiveSeason(ctx.clubId);

  // Pre-check the jersey so a clash doesn't leave an orphan account behind.
  // The partial unique index is still the race-safe backstop.
  if (body.jerseyNumber != null) {
    const clash = await prisma.teamMembership.findFirst({
      where: { teamId, seasonId: season.id, status: "ACTIVE", jerseyNumber: body.jerseyNumber },
    });
    if (clash) {
      throw new ConflictError(
        "Another active player on this team already has that jersey number this season.",
      );
    }
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: {
      email,
      name: body.name,
      role: "PLAYER",
      passwordHash,
      mustChangePassword: true,
      emailVerifiedAt: new Date(), // admin-provisioned — no self-verification step
      playerProfile: {
        create: {
          dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
          contactPhone: body.contactPhone,
          guardianName: body.guardianName,
          guardianContact: body.guardianContact,
        },
      },
    },
    include: { playerProfile: true },
  });

  const membership = await addToRoster(user.playerProfile!.id, teamId, season.id, {
    jerseyNumber: body.jerseyNumber ?? null,
    position: body.position ?? null,
  });

  return created(
    {
      membership,
      user: { id: user.id, name: user.name, email: user.email },
      tempPassword,
    },
    requestId,
  );
});
