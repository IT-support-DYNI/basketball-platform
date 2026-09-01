import { prisma } from "./prisma";

/**
 * Per-club messaging safeguarding rules (brief §13). A `ClubSafeguardingPolicy`
 * row is created lazily with safe defaults the first time it's read; a club
 * administrator can loosen it later.
 */

export type SafeguardingPolicy = {
  blockAdultMinorDirectMessages: boolean;
  guardianAutoIncludedWithMinor: boolean;
  minorAgeThreshold: number;
};

const SAFE_DEFAULT = {
  blockAdultMinorDirectMessages: true,
  guardianAutoIncludedWithMinor: true,
};

export async function getSafeguardingPolicy(clubId: number | null): Promise<SafeguardingPolicy> {
  if (clubId == null) {
    return { ...SAFE_DEFAULT, minorAgeThreshold: 18 };
  }
  const [row, club] = await Promise.all([
    prisma.clubSafeguardingPolicy.upsert({
      where: { clubId },
      create: { clubId, ...SAFE_DEFAULT },
      update: {},
    }),
    prisma.club.findUnique({ where: { id: clubId }, select: { minorAgeThreshold: true } }),
  ]);
  return {
    blockAdultMinorDirectMessages: row.blockAdultMinorDirectMessages,
    guardianAutoIncludedWithMinor: row.guardianAutoIncludedWithMinor,
    minorAgeThreshold: club?.minorAgeThreshold ?? 18,
  };
}

/**
 * Whether a 1:1 direct message between the given people is allowed. Blocked
 * when the policy forbids adult↔minor DMs and exactly one of the two is a
 * minor (adult↔adult and minor↔minor are both fine). Pure — the caller
 * resolves who is a minor.
 */
export function directMessageAllowed(minorFlags: boolean[], policy: SafeguardingPolicy): boolean {
  if (!policy.blockAdultMinorDirectMessages) return true;
  if (minorFlags.length !== 2) return true;
  const minors = minorFlags.filter(Boolean).length;
  return minors !== 1;
}

/** The club everything hangs off (single-club deployment for now). */
export async function primaryClubId(): Promise<number | null> {
  const club = await prisma.club.findFirst({ orderBy: { id: "asc" }, select: { id: true } });
  return club?.id ?? null;
}
