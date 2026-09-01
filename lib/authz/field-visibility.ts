import type { Session } from "next-auth";

import { prisma } from "@/lib/prisma";

/**
 * Field-level visibility for player data (brief §7, §33; Doc 4 §12.2).
 *
 * Every `PlayerProfile` field that isn't universally readable is listed here
 * with the set of *viewer kinds* allowed to see it. `serializePlayerProfile()`
 * strips the rest **server-side**, before the response leaves the API — the
 * frontend is never trusted to hide a field it received.
 *
 * This is the code-level policy; when a per-club `FieldVisibilityPolicy` table
 * lands it replaces `PLAYER_FIELD_VIEWERS`, not the call sites.
 */

export type ViewerKind =
  | "SELF" // the player, or a linked guardian
  | "PUBLIC" // anyone, but only when publicProfileApproved
  | "CLUB_MEMBER" // any authenticated member of the club
  | "TEAMMATE" // a player on one of this player's current teams
  | "TEAM_COACH" // head/assistant coach or team manager of one of those teams
  | "TEAM_WELFARE" // welfare officer of one of those teams
  | "TEAM_MEDICAL" // medical officer of one of those teams
  | "ADMIN";

/** Fields not listed here are always returned (id, name, photoUrl basics, memberships…). */
export const PLAYER_FIELD_VIEWERS: Record<string, ViewerKind[]> = {
  bio: ["SELF", "CLUB_MEMBER", "TEAM_COACH", "TEAM_WELFARE", "TEAM_MEDICAL", "ADMIN", "PUBLIC"],
  nationality: ["SELF", "CLUB_MEMBER", "TEAM_COACH", "TEAM_WELFARE", "TEAM_MEDICAL", "ADMIN"],
  heightCm: ["SELF", "CLUB_MEMBER", "TEAM_COACH", "TEAM_WELFARE", "TEAM_MEDICAL", "ADMIN"],
  preferredHand: ["SELF", "CLUB_MEMBER", "TEAM_COACH", "TEAM_WELFARE", "TEAM_MEDICAL", "ADMIN"],

  dateOfBirth: ["SELF", "TEAM_COACH", "TEAM_WELFARE", "TEAM_MEDICAL", "ADMIN"],
  contactPhone: ["SELF", "TEAM_COACH", "TEAM_WELFARE", "TEAM_MEDICAL", "ADMIN"],
  guardianName: ["SELF", "TEAM_COACH", "TEAM_WELFARE", "TEAM_MEDICAL", "ADMIN"],
  guardianContact: ["SELF", "TEAM_COACH", "TEAM_WELFARE", "TEAM_MEDICAL", "ADMIN"],
  emergencyContactName: ["SELF", "TEAM_COACH", "TEAM_WELFARE", "TEAM_MEDICAL", "ADMIN"],
  emergencyContactPhone: ["SELF", "TEAM_COACH", "TEAM_WELFARE", "TEAM_MEDICAL", "ADMIN"],
  emergencyContactRelation: ["SELF", "TEAM_COACH", "TEAM_WELFARE", "TEAM_MEDICAL", "ADMIN"],

  address: ["SELF", "TEAM_WELFARE", "ADMIN"],
  medicalNotes: ["SELF", "TEAM_MEDICAL", "ADMIN"],
  welfareNotes: ["SELF", "TEAM_WELFARE", "ADMIN"],
};

/** Only a player/guardian/admin may write these. */
export const PLAYER_MEDICAL_FIELDS = ["medicalNotes"] as const;
export const PLAYER_WELFARE_FIELDS = ["welfareNotes"] as const;

export type ViewerScope = {
  kinds: Set<ViewerKind>;
  isSelf: boolean;
};

/**
 * Work out which viewer kinds `session` holds for one player. One DB round-trip
 * (staff assignments on the player's teams + a guardian check when relevant).
 */
export async function resolvePlayerViewerScope(
  session: Session,
  player: { id: number; userId?: number; teamIds: number[] },
): Promise<ViewerScope> {
  const kinds = new Set<ViewerKind>(["CLUB_MEMBER"]);
  const viewerUserId = Number(session.user.id);

  const isSelf = session.user.playerId === player.id;
  if (isSelf) kinds.add("SELF");

  if (session.user.role === "ADMIN") kinds.add("ADMIN");

  if (session.user.role === "GUARDIAN") {
    const link = await prisma.guardianRelationship.findFirst({
      where: { guardianUserId: viewerUserId, playerProfileId: player.id },
      select: { id: true },
    });
    if (link) kinds.add("SELF");
  }

  if (session.user.role === "PLAYER" && !isSelf) {
    const viewerTeamId = session.user.teamId;
    if (viewerTeamId != null && player.teamIds.includes(viewerTeamId)) kinds.add("TEAMMATE");
  }

  const sharedTeamIds = (session.user.teamIds ?? []).filter((t) => player.teamIds.includes(t));
  if (sharedTeamIds.length > 0) {
    const assignments = await prisma.staffAssignment.findMany({
      where: { userId: viewerUserId, teamId: { in: sharedTeamIds } },
      select: { role: true },
    });
    for (const { role } of assignments) {
      if (role === "HEAD_COACH" || role === "ASSISTANT_COACH" || role === "TEAM_MANAGER") kinds.add("TEAM_COACH");
      if (role === "WELFARE_OFFICER") kinds.add("TEAM_WELFARE");
      if (role === "MEDICAL_OFFICER") kinds.add("TEAM_MEDICAL");
    }
    // Legacy single-role coaches have no StaffAssignment rows for their own
    // team in some data; treat a COACH sharing a team as at least TEAM_COACH.
    if (session.user.role === "COACH") kinds.add("TEAM_COACH");
  }

  return { kinds, isSelf };
}

/** Anonymous / public-site scope. */
export const PUBLIC_SCOPE: ViewerScope = { kinds: new Set<ViewerKind>(["PUBLIC"]), isSelf: false };

/**
 * Return a copy of `profile` with every field the viewer can't see removed.
 * `publicProfileApproved` gates the PUBLIC kind for everyone who isn't otherwise
 * privileged.
 */
export function serializePlayerProfile<T extends Record<string, unknown>>(
  profile: T,
  scope: ViewerScope,
): Partial<T> {
  const out: Record<string, unknown> = {};
  const publicOk = profile.publicProfileApproved === true;

  for (const [key, value] of Object.entries(profile)) {
    const allowed = PLAYER_FIELD_VIEWERS[key];
    if (!allowed) {
      out[key] = value;
      continue;
    }
    const canSee = allowed.some((kind) => {
      if (kind === "PUBLIC") return scope.kinds.has("PUBLIC") && publicOk;
      return scope.kinds.has(kind);
    });
    if (canSee) out[key] = value;
  }
  return out as Partial<T>;
}

/** Can this viewer write the field group? (medical/welfare are locked down.) */
export function canEditPlayerField(scope: ViewerScope, field: string): boolean {
  if ((PLAYER_MEDICAL_FIELDS as readonly string[]).includes(field)) {
    return scope.kinds.has("ADMIN") || scope.kinds.has("TEAM_MEDICAL") || scope.isSelf;
  }
  if ((PLAYER_WELFARE_FIELDS as readonly string[]).includes(field)) {
    return scope.kinds.has("ADMIN") || scope.kinds.has("TEAM_WELFARE") || scope.isSelf;
  }
  return true;
}
