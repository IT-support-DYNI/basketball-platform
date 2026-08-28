import { NextRequest, NextResponse } from "next/server";

import { route } from "@/lib/api";
import { registerSchema } from "@/lib/contracts/registration";
import { hashPassword } from "@/lib/password";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

/**
 * Public self-registration — DYNI Blazers PRD §6, Journey A: "the critical
 * first-release journey." Unauthenticated, unlike every other account-
 * creation path in this app (which are Admin/Coach-provisioned — see
 * ARCHITECTURE.md §6.1, superseded for this flow specifically).
 *
 * The account is created immediately and CAN log in right away (unlike the
 * old admin-provisioned temp-password flow) — the applicant set their own
 * password, so there's no secret to relay. What gates them isn't isActive,
 * it's PlayerProfile.registrationStatus, checked by middleware.ts, which
 * routes anyone not yet APPROVED to /registration-status instead of their
 * dashboard.
 */
export const POST = route(async (req: NextRequest) => {
  const body = registerSchema.parse(await req.json());
  const email = body.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists — try logging in instead." }, { status: 409 });
  }

  const team = await prisma.team.findUnique({ where: { id: body.teamId } });
  if (!team || team.status !== "ACTIVE") {
    return NextResponse.json({ error: "That team isn't available for registration." }, { status: 400 });
  }

  const passwordHash = await hashPassword(body.password);
  const now = new Date();

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        name: body.name,
        passwordHash,
        role: "PLAYER",
        isActive: true,
        mustChangePassword: false,
        playerProfile: {
          create: {
            teamId: body.teamId,
            position: body.position,
            jerseyNumber: body.jerseyNumber,
            dateOfBirth: new Date(body.dateOfBirth),
            contactPhone: body.contactPhone,
            guardianName: body.guardianName,
            guardianContact: body.guardianContact,
            registrationStatus: "PENDING",
            registrationSubmittedAt: now,
            consentAcceptedAt: now,
          },
        },
      },
      include: { playerProfile: true },
    });

    await logAudit(tx, {
      actorUserId: created.id,
      action: "REGISTRATION_SUBMITTED",
      entityType: "PlayerProfile",
      entityId: created.playerProfile!.id,
      metadata: { teamId: body.teamId },
    });

    return created;
  });

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
});
