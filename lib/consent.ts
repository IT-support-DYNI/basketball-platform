import type { ConsentDocumentType } from "@prisma/client";
import type { Session } from "next-auth";

import { prisma } from "./prisma";
import { BadRequestError, ForbiddenError } from "./api/errors";

/**
 * Versioned, append-only consent (brief §24). Each `ConsentDocument` has an
 * ordered list of `ConsentDocumentVersion`s; the latest is the "current" one.
 * A `ConsentRecord` is one player's acceptance of one version. Publishing a new
 * version of a required document makes it outstanding for everyone again.
 */

export const CONSENT_TYPE_LABEL: Record<ConsentDocumentType, string> = {
  CODE_OF_CONDUCT: "Code of conduct",
  PRIVACY_NOTICE: "Privacy notice",
  MEDIA_CONSENT: "Photography & media consent",
  MEDICAL_CONSENT: "Emergency medical treatment consent",
  DATA_PROCESSING: "Data processing agreement",
  TRIP_CONSENT: "Trips & travel consent",
  OTHER: "Club document",
};

export type ConsentItem = {
  documentId: number;
  type: ConsentDocumentType;
  title: string;
  required: boolean;
  version: { id: number; version: number; body: string; publishedAt: Date };
  acceptedAt: Date | null;
  acceptedByGuardian: boolean;
};

/** Every active consent document with its current version and whether this
 *  player has accepted that exact version. */
export async function consentStatusFor(playerProfileId: number): Promise<ConsentItem[]> {
  const docs = await prisma.consentDocument.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
    include: {
      versions: { orderBy: { version: "desc" }, take: 1 },
    },
  });

  const currentVersionIds = docs.map((d) => d.versions[0]?.id).filter((v): v is number => v != null);
  const records = await prisma.consentRecord.findMany({
    where: { playerProfileId, documentVersionId: { in: currentVersionIds } },
    select: { documentVersionId: true, acceptedAt: true, byGuardian: true },
  });
  const byVersion = new Map(records.map((r) => [r.documentVersionId, r]));

  return docs
    .filter((d) => d.versions[0])
    .map((d) => {
      const v = d.versions[0];
      const rec = byVersion.get(v.id);
      return {
        documentId: d.id,
        type: d.type,
        title: d.title,
        required: d.requiredForPlayers,
        version: { id: v.id, version: v.version, body: v.body, publishedAt: v.publishedAt },
        acceptedAt: rec?.acceptedAt ?? null,
        acceptedByGuardian: rec?.byGuardian ?? false,
      };
    });
}

/** Required documents this player hasn't accepted at their current version. */
export async function outstandingConsents(playerProfileId: number): Promise<ConsentItem[]> {
  const all = await consentStatusFor(playerProfileId);
  return all.filter((c) => c.required && c.acceptedAt == null);
}

/** True if the player is clear to use the app (no outstanding required docs). */
export async function hasOutstandingConsent(playerProfileId: number): Promise<boolean> {
  const outstanding = await outstandingConsents(playerProfileId);
  return outstanding.length > 0;
}

/** Record acceptance of one version for one player. Idempotent per (version,
 *  player) via the unique index. */
export async function acceptConsent(
  documentVersionId: number,
  playerProfileId: number,
  acceptedByUserId: number,
  byGuardian: boolean,
) {
  return prisma.consentRecord.upsert({
    where: { documentVersionId_playerProfileId: { documentVersionId, playerProfileId } },
    create: { documentVersionId, playerProfileId, acceptedByUserId, byGuardian },
    update: {}, // acceptance is append-only — never overwrite the original timestamp
  });
}

/** Which player the caller may manage consent for. A player → their own
 *  profile; a guardian → any linked child (must pass `playerProfileId`). */
export async function resolveConsentSubject(
  session: Session,
  playerProfileId?: number,
): Promise<{ playerProfileId: number; byGuardian: boolean }> {
  if (session.user.role === "PLAYER" && session.user.playerId) {
    if (playerProfileId && playerProfileId !== session.user.playerId) {
      throw new ForbiddenError("You can only manage your own consent.");
    }
    return { playerProfileId: session.user.playerId, byGuardian: false };
  }
  if (session.user.role === "GUARDIAN") {
    if (!playerProfileId) throw new BadRequestError("Which child? Pass playerProfileId.");
    const link = await prisma.guardianRelationship.findFirst({
      where: { guardianUserId: Number(session.user.id), playerProfileId },
      select: { id: true },
    });
    if (!link) throw new ForbiddenError("That child isn't linked to your account.");
    return { playerProfileId, byGuardian: true };
  }
  throw new ForbiddenError("Only players and guardians manage consent.");
}

/** Publish a new version of a document (admin). Version number auto-increments. */
export async function publishConsentVersion(documentId: number, body: string) {
  return prisma.$transaction(async (tx) => {
    const last = await tx.consentDocumentVersion.findFirst({
      where: { documentId },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    return tx.consentDocumentVersion.create({
      data: { documentId, version: (last?.version ?? 0) + 1, body },
    });
  });
}
