import { ConflictError, BadRequestError } from "./api/errors";
import { isMinor } from "./age";
import { hashPassword, generateTempPassword } from "./password";
import { issueAuthToken } from "./auth-tokens";
import { sendMail } from "./mail";
import { verifyEmailMessage } from "./mail/templates";
import { baseUrl } from "./base-url";
import { logAudit } from "./audit";
import { prisma } from "./prisma";
import type { RegisterInput, RegisterGuardianInput } from "./contracts";

/**
 * Account creation for the three registration entry points — direct self,
 * direct guardian, and the multi-step draft submit. All the validation and
 * side effects (audit, verification email) live here so they can't drift.
 */

async function activeTeamWithClub(teamId: number) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { club: { select: { minorAgeThreshold: true } } },
  });
  if (!team || team.status !== "ACTIVE") {
    throw new BadRequestError("That team isn't available for registration.");
  }
  return team;
}

export async function createSelfRegistration(body: RegisterInput): Promise<{ id: number; email: string }> {
  const email = body.email.trim().toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) {
    throw new ConflictError("An account with that email already exists — try signing in instead.");
  }

  const team = await activeTeamWithClub(body.teamId);
  const threshold = team.club?.minorAgeThreshold ?? 18;
  if (isMinor(new Date(body.dateOfBirth), threshold)) {
    throw new BadRequestError(
      `Players under ${threshold} can't register themselves — a parent or guardian needs to do it.`,
    );
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
        playerProfile: {
          create: {
            registrationTeamId: body.teamId,
            registrationPosition: body.position,
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

  const token = await issueAuthToken(user.id, "EMAIL_VERIFICATION");
  await sendMail(verifyEmailMessage(user.email, user.name, `${baseUrl()}/verify-email?token=${token}`));
  return { id: user.id, email: user.email };
}

export async function createGuardianRegistration(
  body: RegisterGuardianInput,
): Promise<{ guardianId: number; childId: number; guardianEmail: string }> {
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

  await activeTeamWithClub(body.teamId);

  const now = new Date();
  const guardianHash = await hashPassword(body.guardianPassword);
  const childHash = await hashPassword(generateTempPassword());
  const childLoginEmail = childEmail ?? `child.${Date.now().toString(36)}@guardian.local`;

  const { guardian, child } = await prisma.$transaction(async (tx) => {
    const g = await tx.user.create({
      data: { email: guardianEmail, name: body.guardianName, passwordHash: guardianHash, role: "GUARDIAN", isActive: true },
    });
    const c = await tx.user.create({
      data: {
        email: childLoginEmail,
        name: body.childName,
        passwordHash: childHash,
        role: "PLAYER",
        isActive: true,
        mustChangePassword: true,
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
      data: { guardianUserId: g.id, playerProfileId: c.playerProfile!.id, relationshipLabel: body.relationshipLabel },
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
  return { guardianId: guardian.id, childId: child.id, guardianEmail };
}
