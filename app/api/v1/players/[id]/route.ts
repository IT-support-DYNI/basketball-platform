import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route } from "@/lib/api";
import { requireAuth, requireRole, requirePlayerAccess, canViewPlayerContactDetails } from "@/lib/authorization";
import { updatePlayerSchema } from "@/lib/contracts/team";
import { prisma } from "@/lib/prisma";

export const GET = route<{ id: string }>(async (_req, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const playerId = Number(params.id);

  const player = await prisma.playerProfile.findUnique({
    where: { id: playerId },
    include: {
      user: { select: { id: true, name: true, email: true, isActive: true } },
      team: { select: { id: true, name: true } },
    },
  });
  if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });

  requirePlayerAccess(session, player);
  const canSeeContact = canViewPlayerContactDetails(session, player);

  return NextResponse.json({
    ...player,
    contactPhone: canSeeContact ? player.contactPhone : undefined,
    guardianName: canSeeContact ? player.guardianName : undefined,
    guardianContact: canSeeContact ? player.guardianContact : undefined,
  });
});

/** Admin/Coach can edit roster + contact fields; a Player may only edit their own contact info. */
export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const playerId = Number(params.id);

  const player = await prisma.playerProfile.findUnique({ where: { id: playerId } });
  if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });

  requirePlayerAccess(session, player);
  const body = updatePlayerSchema.parse(await req.json());

  const isSelfServicePlayer = session.user.role === "PLAYER";
  if (isSelfServicePlayer) {
    // Players may only update their own contact details, never roster/roles/status fields.
    const updated = await prisma.playerProfile.update({
      where: { id: playerId },
      data: { contactPhone: body.contactPhone },
    });
    return NextResponse.json(updated);
  }

  requireRole(session, ["ADMIN", "COACH"]);
  const updated = await prisma.playerProfile.update({
    where: { id: playerId },
    data: {
      position: body.position,
      jerseyNumber: body.jerseyNumber,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      photoUrl: body.photoUrl,
      contactPhone: body.contactPhone,
      guardianName: body.guardianName,
      guardianContact: body.guardianContact,
      status: body.status,
      teamId: body.teamId,
    },
  });

  return NextResponse.json(updated);
});
