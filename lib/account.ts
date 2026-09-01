import type { Prisma } from "@prisma/client";

import { prisma } from "./prisma";
import { logAudit } from "./audit";

/**
 * Self-service account data — export ("right of access") and deletion ("right to
 * erasure"), brief §32-33. Deletion anonymises rather than hard-deletes: a
 * player's attendance, evaluations and messages are operational club records
 * that other people's history depends on, so the personal data is scrubbed and
 * the rows kept under legitimate interest. Retention periods for the anonymised
 * shell are a club policy input (Doc 6 §19.6) — tracked in docs/SECURITY.md.
 */

/* ── Guard: may this account delete itself? ────────────────────────────── */

export type DeletionEligibility = { ok: true } | { ok: false; reason: string };

/** The last active administrator can't remove their own account — the club
 *  would be left with no one who can manage it. */
export function canDeleteOwnAccount(role: string, activeAdminCount: number): DeletionEligibility {
  if (role === "ADMIN" && activeAdminCount <= 1) {
    return {
      ok: false,
      reason: "You're the only active administrator. Add another admin before deleting your account.",
    };
  }
  return { ok: true };
}

/* ── The scrubbed field values ────────────────────────────────────────── */

/** What a User row looks like after anonymisation. Pure so it can be tested
 *  and reused by an admin-initiated erasure later. */
export function anonymisedUserFields(userId: number): Prisma.UserUpdateInput {
  return {
    name: "Former member",
    email: `deleted-${userId}@deleted.invalid`,
    passwordHash: null,
    isActive: false,
    mustChangePassword: false,
    calendarToken: null,
  };
}

/** The personal-data columns wiped from a PlayerProfile. */
export function anonymisedPlayerProfileFields(): Prisma.PlayerProfileUpdateInput {
  return {
    photoUrl: null,
    nationality: null,
    heightCm: null,
    preferredHand: null,
    bio: null,
    dateOfBirth: null,
    contactPhone: null,
    guardianName: null,
    guardianContact: null,
    address: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactRelation: null,
    medicalNotes: null,
    welfareNotes: null,
    publicProfileApproved: false,
  };
}

/* ── Export ───────────────────────────────────────────────────────────── */

/** Everything the club holds that is *about* this user, as a plain object. */
export async function exportAccountData(userId: number) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      coachProfile: true,
      playerProfile: {
        include: {
          memberships: { include: { team: { select: { name: true } }, season: { select: { name: true } } } },
          consentRecords: { include: { documentVersion: { include: { document: { select: { title: true, type: true } } } } } },
          evaluations: { include: { categoryScores: true } },
          feedback: { select: { message: true, createdAt: true } },
          attendanceRecords: { select: { eventId: true, status: true, method: true, checkInAt: true, recordedAt: true } },
        },
      },
      guardianOf: { include: { player: { include: { user: { select: { name: true } } } } } },
      availabilityResponses: { select: { eventId: true, response: true, note: true, respondedAt: true } },
      notifications: { select: { type: true, title: true, message: true, createdAt: true, isRead: true } },
      messagesAuthored: { select: { conversationId: true, body: true, createdAt: true, editedAt: true, deletedAt: true } },
      announcements: { select: { title: true, body: true, scope: true, createdAt: true } },
      authSessions: { select: { userAgent: true, createdAt: true, lastSeenAt: true, revokedAt: true } },
      auditLogsActed: { select: { action: true, entityType: true, entityId: true, createdAt: true } },
    },
  });

  return {
    exportedAt: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
    },
    coachProfile: user.coachProfile,
    playerProfile: user.playerProfile,
    guardianOf: user.guardianOf.map((g) => ({
      child: g.player.user.name,
      relationship: g.relationshipLabel,
      since: g.createdAt,
    })),
    rsvps: user.availabilityResponses,
    notifications: user.notifications,
    messages: user.messagesAuthored,
    announcements: user.announcements,
    sessions: user.authSessions,
    actionsTaken: user.auditLogsActed,
  };
}

/* ── Deletion (anonymise) ─────────────────────────────────────────────── */

export async function anonymiseAccount(userId: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { role: true, email: true, playerProfile: { select: { id: true } } },
    });

    // Drop credentials, devices and anything that could re-identify or notify.
    await tx.authSession.deleteMany({ where: { userId } });
    await tx.authToken.deleteMany({ where: { userId } });
    await tx.userMfa.deleteMany({ where: { userId } });
    await tx.pushSubscription.deleteMany({ where: { userId } });
    await tx.notification.deleteMany({ where: { userId } });
    await tx.notificationPreference.deleteMany({ where: { userId } });
    await tx.guardianRelationship.deleteMany({ where: { guardianUserId: userId } });
    await tx.registrationDraft.deleteMany({ where: { email: user.email } });

    if (user.playerProfile) {
      await tx.playerProfile.update({
        where: { id: user.playerProfile.id },
        data: anonymisedPlayerProfileFields(),
      });
      await tx.teamMembership.updateMany({
        where: { playerProfileId: user.playerProfile.id, status: { not: "FORMER" } },
        data: { status: "FORMER", leftAt: new Date() },
      });
    }

    await tx.user.update({ where: { id: userId }, data: anonymisedUserFields(userId) });

    await logAudit(tx, {
      actorUserId: userId,
      action: "ACCOUNT_DELETED",
      entityType: "User",
      entityId: userId,
      metadata: { role: user.role },
    });
  });
}

export function activeAdminCount(): Promise<number> {
  return prisma.user.count({ where: { role: "ADMIN", isActive: true } });
}
