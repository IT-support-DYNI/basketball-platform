import { UserRole } from "@prisma/client";
import { Session } from "next-auth";

import { AuthorizationError } from "./api/errors";

/*
 * Two-layer RBAC, per ARCHITECTURE.md §3.2:
 *   1. requireRole      — route-level: can this role even call this endpoint?
 *   2. requireTeamAccess / requirePlayerAccess — row-level: does this
 *      specific caller own the resource they're trying to touch?
 * Route handlers call these and let AuthorizationError (an ApiError) propagate
 * to the shared catch in lib/api/route.ts, which turns it into a 401/403.
 */

export { AuthorizationError };

export function requireAuth(session: Session | null): Session {
  if (!session?.user || session.user.isActive === false) {
    throw new AuthorizationError("Authentication required", 401);
  }
  return session;
}

export function requireRole(session: Session | null, roles: UserRole[]): Session {
  const authed = requireAuth(session);
  if (!roles.includes(authed.user.role)) {
    throw new AuthorizationError("You don't have permission to do that", 403);
  }
  return authed;
}

export function isAdmin(session: Session): boolean {
  return session.user.role === "ADMIN";
}

/** Row-level check: can this caller read/write data scoped to `teamId`? */
export function requireTeamAccess(session: Session, teamId: number): void {
  const { role, teamIds, teamId: ownTeamId } = session.user;

  if (role === "ADMIN") return;
  if (role === "COACH" && teamIds?.includes(teamId)) return;
  if (role === "PLAYER" && ownTeamId === teamId) return;

  throw new AuthorizationError("You don't have access to this team", 403);
}

/**
 * Row-level check: can this caller read/write `player`'s data?
 * Takes the already-loaded player (id + teamId) so this never needs
 * its own extra DB query — call it after loading the resource.
 */
export function requirePlayerAccess(
  session: Session,
  player: { id: number; teamId: number | null }
): void {
  const { role, playerId, teamIds } = session.user;

  if (role === "ADMIN") return;
  if (role === "PLAYER" && playerId === player.id) return;
  if (role === "COACH" && player.teamId != null && teamIds?.includes(player.teamId)) {
    return;
  }

  throw new AuthorizationError("You don't have access to this player's data", 403);
}

/** Coaches/players may only see contact & guardian fields for players on their own team (or their own). */
export function canViewPlayerContactDetails(
  session: Session,
  player: { id: number; teamId: number | null }
): boolean {
  try {
    requirePlayerAccess(session, player);
    return session.user.role === "ADMIN" || session.user.role === "COACH";
  } catch {
    return false;
  }
}
