import type { Session } from "next-auth";

/**
 * Roles.
 *
 * The brief (§4) defines eleven roles. The database currently stores a single
 * `User.role` enum with three values — the multi-role `UserRole` join table
 * (scoped by club / team / squad / season) is a later migration. Until then,
 * `roleAssignmentsFor()` maps the one stored role onto the new model, so the
 * rest of the authorization engine is already written against the final shape:
 * when the join table lands, only this file changes.
 */

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  CLUB_ADMIN: "CLUB_ADMIN",
  HEAD_COACH: "HEAD_COACH",
  ASSISTANT_COACH: "ASSISTANT_COACH",
  TEAM_MANAGER: "TEAM_MANAGER",
  WELFARE_OFFICER: "WELFARE_OFFICER",
  MEDICAL_OFFICER: "MEDICAL_OFFICER",
  STATISTICIAN: "STATISTICIAN",
  PLAYER: "PLAYER",
  GUARDIAN: "GUARDIAN",
  SUPPORTER: "SUPPORTER",
} as const;

export type Role = keyof typeof ROLES;

export type Scope = {
  clubId?: number;
  teamId?: number;
  squadId?: number;
  seasonId?: number;
};

export type RoleAssignment = { role: Role; scope: Scope };

/** Everything the ability engine needs about the caller, independent of how
 *  roles are stored. */
export type Principal = {
  userId: number;
  playerId?: number;
  coachProfileId?: number;
  assignments: RoleAssignment[];
};

const LEGACY_ROLE_MAP: Record<string, Role> = {
  ADMIN: "CLUB_ADMIN",
  COACH: "HEAD_COACH",
  PLAYER: "PLAYER",
  GUARDIAN: "GUARDIAN",
};

/**
 * Build the caller's role assignments from the current single-role session.
 * A coach gets a club-wide "is a coach" assignment plus one per team they're on,
 * so a role gate ("is this user a coach at all?") and a resource gate ("this
 * team specifically") can both be answered.
 */
export function roleAssignmentsFor(session: Session): RoleAssignment[] {
  const u = session.user;
  // clubId isn't on the session yet (one club today; populating it is a W2
  // tenancy follow-up). Left undefined → club-scoped rules aren't narrowed,
  // which is correct for a single-club deployment.
  const clubId: number | undefined = undefined;
  const mapped = LEGACY_ROLE_MAP[u.role];
  if (!mapped) return [];

  if (mapped === "HEAD_COACH") {
    const base: RoleAssignment = { role: "HEAD_COACH", scope: { clubId } };
    const perTeam = (u.teamIds ?? []).map(
      (teamId): RoleAssignment => ({ role: "HEAD_COACH", scope: { clubId, teamId } }),
    );
    return [base, ...perTeam];
  }

  if (mapped === "PLAYER") {
    return [{ role: "PLAYER", scope: { clubId, teamId: u.teamId ?? undefined } }];
  }

  // CLUB_ADMIN / GUARDIAN
  return [{ role: mapped, scope: { clubId } }];
}

export function principalFor(session: Session): Principal {
  return {
    userId: Number(session.user.id),
    playerId: session.user.playerId ?? undefined,
    coachProfileId: session.user.coachProfileId ?? undefined,
    assignments: roleAssignmentsFor(session),
  };
}

/** The distinct role names the caller holds — the "layer 1" role gate. */
export function rolesFor(session: Session): Set<Role> {
  return new Set(roleAssignmentsFor(session).map((a) => a.role));
}
