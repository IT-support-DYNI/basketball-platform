import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { withApi } from "@/lib/api";
import { requireAuth, requireRole, requireTeamAccess, canViewPlayerContactDetails } from "@/lib/authorization";
import { addPlayerToTeamSchema } from "@/lib/validation/team";
import { generateTempPassword, hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const GET = withApi<{ params: { id: string } }>(async (_req, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const teamId = Number(params.id);
  requireTeamAccess(session, teamId);

  const players = await prisma.playerProfile.findMany({
    where: { teamId },
    include: { user: { select: { id: true, name: true, email: true, isActive: true } } },
    orderBy: { jerseyNumber: "asc" },
  });

  const canSeeContact = players.length > 0 && canViewPlayerContactDetails(session, players[0]);

  const shaped = players.map((p) => ({
    ...p,
    contactPhone: canSeeContact ? p.contactPhone : undefined,
    guardianName: canSeeContact ? p.guardianName : undefined,
    guardianContact: canSeeContact ? p.guardianContact : undefined,
  }));

  return NextResponse.json(shaped);
});

/** Add a player: creates the underlying User (role PLAYER, temp password) + PlayerProfile in one call. */
export const POST = withApi<{ params: { id: string } }>(async (req, { params }) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN", "COACH"]);
  const teamId = Number(params.id);
  requireTeamAccess(session, teamId);

  const body = addPlayerToTeamSchema.parse(await req.json());
  const email = body.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 });
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
      playerProfile: {
        create: {
          teamId,
          position: body.position,
          jerseyNumber: body.jerseyNumber,
          dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
          contactPhone: body.contactPhone,
          guardianName: body.guardianName,
          guardianContact: body.guardianContact,
        },
      },
    },
    include: { playerProfile: true },
  });

  return NextResponse.json({ player: user.playerProfile, user: { id: user.id, name: user.name, email: user.email }, tempPassword }, { status: 201 });
});
