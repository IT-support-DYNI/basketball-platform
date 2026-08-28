# Authorization

Two layers (ARCHITECTURE.md §3.2), one engine.

```
session ──roleAssignmentsFor()──▶ RoleAssignment[]  ──defineAbilityFor()──▶ CASL ability
   │                                                                            │
   └── requireRole()  (layer 1: does the caller hold this role?)                │
                                                                                ▼
                        authorize(session).can(action, subject, resource)  ◀── layer 2
                        requireAbility(session, action, subject, resource)      (resource + field rules)
```

## Files (`lib/authz/`)

| File | Role |
|---|---|
| `roles.ts` | The 11 roles, `Scope`, and `roleAssignmentsFor(session)` — maps today's single `User.role` onto scoped assignments. **When the `UserRole` join table migration lands, only this file changes.** |
| `ability.ts` | The policy. `defineAbilityFor(principal)` builds a CASL `MongoAbility` from the assignments. One `switch` per role; `PlayerContact` / `PlayerMedical` / `PlayerWelfare` are separate subjects so the field-visibility engine (W5) reads off the same rules. |
| `guard.ts` | `authorize()`, `requireAbility()`, and the back-compat helpers (`requireRole`, `requireTeamAccess`, `requirePlayerAccess`, `canViewPlayerContactDetails`, `requireAuth`, `isAdmin`) — all now one engine. |
| `ability.test.ts` | The permission matrix — every role × subject × action, allow and deny, cross-team and cross-tenant negatives. |

`lib/authorization.ts` re-exports `lib/authz/guard` so the ~34 route handlers that import `@/lib/authorization` are unchanged.

## Writing a check in a route

```ts
import { requireAuth, requireRole, authorize, requireAbility } from "@/lib/authorization";

const session = requireAuth(await getServerSession(authOptions));

// layer 1 — coarse role gate
requireRole(session, ["COACH"]);

// layer 2 — resource rule (throws ForbiddenError -> 403)
requireAbility(session, "record", "Attendance", { teamId: trainingSession.teamId });

// or as a boolean, e.g. for field filtering
const showContact = authorize(session).can("read", "PlayerContact", { id: player.id, teamId: player.teamId });
```

## Actions & subjects

Actions: `manage` `create` `read` `update` `delete` `access` `record` `verify`
`approve` `moderate` `export`.

Subjects: `Team` `PlayerProfile` `PlayerContact` `PlayerMedical` `PlayerWelfare`
`TrainingSession` `Attendance` `Announcement` `Video` `Evaluation` `Feedback`
`Notification` `User` `Registration` `Club` `all`.

## Not done in W3 (own migration)

Email verification, password reset, refresh-token rotation, admin TOTP MFA,
device / active-session list, account lockout — all need schema tables. Planned
as a single migration + an email port (console adapter for local dev).
