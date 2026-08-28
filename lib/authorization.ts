/*
 * Authorization — thin re-export.
 *
 * The engine lives in lib/authz/ (roles → assignments → CASL ability → guards).
 * This file keeps the import path `@/lib/authorization` working for the route
 * handlers that predate the split.
 *
 * Two-layer model (ARCHITECTURE.md §3.2):
 *   1. requireRole            — route-level: does the caller hold this role?
 *   2. authorize / requireAbility / requireTeamAccess / requirePlayerAccess
 *                             — resource-level, from the one policy in
 *                               lib/authz/ability.ts
 */

export { AuthorizationError } from "./api/errors";
export {
  authorize,
  requireAbility,
  requireAuth,
  requireRole,
  isAdmin,
  requireTeamAccess,
  requirePlayerAccess,
  canViewPlayerContactDetails,
  rolesFor,
} from "./authz/guard";
export { ROLES, type Role } from "./authz/roles";
export type { Action, Subject, AppAbility } from "./authz/ability";
