import { NextRequest } from "next/server";

import { route, created, ConflictError, BadRequestError } from "@/lib/api";
import { registerGuardianSchema } from "@/lib/contracts/registration";
import { generateTempPassword, hashPassword } from "@/lib/password";
import { issueAuthToken } from "@/lib/auth-tokens";
import { sendMail } from "@/lib/mail";
import { verifyEmailMessage } from "@/lib/mail/templates";
import { baseUrl } from "@/lib/base-url";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

/**
 * Guardian-led registration for a minor (brief §25). Creates:
 *   - a GUARDIAN account (logs in, manages the child)
 *   - a child PLAYER account + PlayerProfile (registrationStatus PENDING)
 *   - a GuardianRelationship linking them
 * The guardian verifies their own email; the child gets a verification /
 * set-password link only if an email was provided.
 */
export const POST = route(async (req: NextRequest, { requestId }) => {
  const body = registerGuardianSchema.parse(await req.json());
  const guardianEmail = body.guardianEmail.trim().toLowerCase();
  const childEmail = body.childEmail?.trim().toLowerCase();

  if (childEmail && childEmail === guardianEmail) {
    throw new BadRequestError("The child needs a different email address from the guardian.");
  }
  const clash = await prisma.user.findFirst({
    where: { email: { in: [guardianEmail, ...(childEmail ? [childEmail] : [])] } },
    select: { email: true },
  });
  if (clash) {
    throw new ConflictError(
      clash.email === guardianEmail
        ? "An account with the guardian's email already exists — sign in and add your child from there."
        : "An account with your child's email already exists.",
    );
  }

  const team = await prisma.team.findUnique({ where: { id: body.teamId } });
  if (!team || team.status !== "ACTIVE") {
    throw new BadRequestError("That team isn't available for registration.");
  }

  const now = new Date();
  const guardianHash = await hashPassword(body.guardianPassword);
  // The child's login is set later via the emailed link (or by an admin);
  // give it an unusable random hash so the row is valid meanwhile.
  const childHash = await hashPassword(generateTempPassword());
  // No child email → a placeholder that can't receive mail or be signed into.
  const childLoginEmail = childEmail ?? `child.${Date.now().toString(36)}@guardian.local`;

  const { guardian, child } = await prisma.$transaction(async (tx) => {
    const g = await tx.user.create({
      data: {
        email: guardianEmail,
        name: body.guardianName,
        passwordHash: guardianHash,
        role: "GUARDIAN",
        isActive: true,
      },
    });
    const c = await tx.user.create({
      data: {
        email: childLoginEmail,
        name: body.childName,
        passwordHash: childHash,
        role: "PLAYER",
        isActive: true,
        mustChangePassword: true,
        // No self-verification step for the child — the guardian vouches, and
        // an admin still can't approve until the guardian's own email is verified.
        emailVerifiedAt: childEmail ? null : now,
        playerProfile: {
          create: {
            registrationTeamId: body.teamId,
            registrationPosition: body.position,
            dateOfBirth: new Date(body.childDateOfBirth),
            guardianName: body.guardianName,
            guardianContact: body.guardianPhone,
            registrationStatus: "PENDING",
            registrationSubmittedAt: now,
            consentAcceptedAt: now,
          },
        },
      },
      include: { playerProfile: true },
    });
    await tx.guardianRelationship.create({
      data: {
        guardianUserId: g.id,
        playerProfileId: c.playerProfile!.id,
        relationshipLabel: body.relationshipLabel,
      },
    });
    await logAudit(tx, {
      actorUserId: g.id,
      action: "REGISTRATION_SUBMITTED",
      entityType: "PlayerProfile",
      entityId: c.playerProfile!.id,
      metadata: { teamId: body.teamId, byGuardian: true },
    });
    return { guardian: g, child: c };
  });

  const gToken = await issueAuthToken(guardian.id, "EMAIL_VERIFICATION");
  await sendMail(verifyEmailMessage(guardian.email, guardian.name, `${baseUrl()}/verify-email?token=${gToken}`));
  if (childEmail) {
    const cToken = await issueAuthToken(child.id, "EMAIL_VERIFICATION");
    await sendMail(verifyEmailMessage(childEmail, child.name, `${baseUrl()}/verify-email?token=${cToken}`));
  }

  return created({ guardianId: guardian.id, childId: child.id, guardianEmail }, requestId);
});
