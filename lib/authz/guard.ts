import { subject as caslSubject } from "@casl/ability";
import type { Session } from "next-auth";
import { UserRole } from "@prisma/client";

import { ForbiddenError, UnauthorizedError } from "@/lib/api/errors";
import { defineAbilityFor, type Action, type AppAbility, type Subject } from "./ability";
import { principalFor, rolesFor } from "./roles";

/**
 * The authorization entry point for route handlers.
 *
 *   const session = requireAuth(await getServerSession(authOptions));
 *   requireAbility(session, "record", "Attendance", { teamId });
 *   if (authorize(session).can("read", "PlayerContact", player)) { … }
 *
 * The coarse role gate stays as `requireRole`; resource/field checks go through
 * the ability so the rules live in one policy file (./ability.ts).
 */

/** Ability is built once per session object. The session is stable within a
 *  request (and re-created between requests), so a WeakMap gives per-request
 *  memoization without holding anything alive. */
const abilityCache = new WeakMap<Session, AppAbility>();
function abilityForSession(session: Session): AppAbility {
  let ability = abilityCache.get(session);
  if (!ability) {
    ability = defineAbilityFor(principalFor(session));
    abilityCache.set(session, ability);
  }
  return ability;
}

type Resource = Record<string, unknown>;

export function authorize(session: Session) {
  const ability = abilityForSession(session);
  return {
    can(action: Action, subject: Subject, resource?: Resource): boolean {
      return ability.can(action, resource ? caslSubject(subject, resource) : subject);
    },
    cannot(action: Action, subject: Subject, resource?: Resource): boolean {
      return ability.cannot(action, resource ? caslSubject(subject, resource) : subject);
    },
  };
}

export function requireAbility(
  session: Session,
  action: Action,
  subject: Subject,
  resource?: Resource,
  message?: string,
): void {
  if (authorize(session).cannot(action, subject, resource)) {
    throw new ForbiddenError(message ?? "You don't have permission to do that.");
  }
}

/* -------------------------------------------------------------------------- */
/*  Coarse gates + back-compat helpers                                         */
/*  Same signatures and messages as before — reimplemented on the one engine   */
/*  so ~34 existing route handlers keep working unchanged.                     */
/* -------------------------------------------------------------------------- */

export function requireAuth(session: Session | null): Session {
  if (!session?.user || session.user.isActive === false) {
    throw new UnauthorizedError("Authentication required");
  }
  return session;
}

/** Layer-1 role gate. `roles` are the legacy DB enum values. */
export function requireRole(session: Session | null, roles: UserRole[]): Session {
  const authed = requireAuth(session);
  if (!roles.includes(authed.user.role)) {
    throw new ForbiddenError("You don't have permission to do that");
  }
  return authed;
}

export function isAdmin(session: Session): boolean {
  return session.user.role === "ADMIN";
}

/** Row-level: can this caller touch data scoped to `teamId`? */
export function requireTeamAccess(session: Session, teamId: number): void {
  if (authorize(session).cannot("access", "Team", { id: teamId })) {
    throw new ForbiddenError("You don't have access to this team");
  }
}

/** Row-level: can this caller read `player`'s data? Pass the already-loaded
 *  player so this needs no extra query. */
export function requirePlayerAccess(
  session: Session,
  player: { id: number; teamId: number | null },
): void {
  if (
    authorize(session).cannot("read", "PlayerProfile", {
      id: player.id,
      teamId: player.teamId ?? undefined,
    })
  ) {
    throw new ForbiddenError("You don't have access to this player's data");
  }
}

/** Contact + guardian fields: admins and the player's own coach(es) only —
 *  deliberately not the player themselves, matching the prior contract. */
export function canViewPlayerContactDetails(
  session: Session,
  player: { id: number; teamId: number | null },
): boolean {
  return authorize(session).can("read", "PlayerContact", {
    id: player.id,
    teamId: player.teamId ?? undefined,
  });
}

export { rolesFor };
