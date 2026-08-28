import { NextRequest } from "next/server";

import { route, created, ConflictError, BadRequestError } from "@/lib/api";
import { registerSchema } from "@/lib/contracts/registration";
import { hashPassword } from "@/lib/password";
import { issueAuthToken } from "@/lib/auth-tokens";
import { sendMail } from "@/lib/mail";
import { verifyEmailMessage } from "@/lib/mail/templates";
import { baseUrl } from "@/lib/base-url";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

/**
 * Public self-registration — DYNI Blazers PRD §6, Journey A: "the critical
 * first-release journey." Unauthenticated, unlike every other account-creation
 * path (which are Admin/Coach-provisioned — ARCHITECTURE.md §6.1).
 *
 * The account is created immediately and can sign in right away, but two gates
 * apply before full access:
 *   1. email verification — a link is emailed; an admin can't approve an
 *      unverified registration
 *   2. PlayerProfile.registrationStatus — middleware routes anyone not APPROVED
 *      to /registration-status
 */
export const POST = route(async (req: NextRequest, { requestId }) => {
  const body = registerSchema.parse(await req.json());
  const email = body.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ConflictError("An account with that email already exists — try signing in instead.");
  }

  const team = await prisma.team.findUnique({ where: { id: body.teamId } });
  if (!team || team.status !== "ACTIVE") {
    throw new BadRequestError("That team isn't available for registration.");
  }

  const passwordHash = await hashPassword(body.password);
  const now = new Date();

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
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
      actorUserId: createdUser.id,
      action: "REGISTRATION_SUBMITTED",
      entityType: "PlayerProfile",
      entityId: createdUser.playerProfile!.id,
      metadata: { teamId: body.teamId },
    });

    return createdUser;
  });

  const token = await issueAuthToken(user.id, "EMAIL_VERIFICATION");
  await sendMail(verifyEmailMessage(user.email, user.name, `${baseUrl()}/verify-email?token=${token}`));

  return created({ id: user.id, email: user.email }, requestId);
});
