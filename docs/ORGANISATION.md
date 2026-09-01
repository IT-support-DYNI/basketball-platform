# Organisation model (W4)

```
Club ──< Season ──< Squad          (a roster grouping within a team for a season)
  │        │
  └──< Team ──< TeamMembership >── PlayerProfile   (jersey / position / status — season-scoped)
       │
       └──< StaffAssignment >── User   (HEAD_COACH, ASSISTANT_COACH, TEAM_MANAGER, …)
```

**The key move:** a player's jersey number, position and status are on
`TeamMembership` (one per player per team per season), **not** on `PlayerProfile`
(brief §5). A player accumulates memberships across seasons — that's the
historical record. `Squad` is an optional finer grouping (`Senior A`, `U16 B`);
`TeamMembership.squadId` places a player in one.

## The active-jersey rule

No two **ACTIVE** members share a jersey number in the same team + season.
Enforced by a **partial unique index** (`WHERE status = 'ACTIVE' AND
jerseyNumber IS NOT NULL`), added by raw SQL in the migration — so it holds
under concurrent requests. A clash returns `409 CONFLICT`. Roster routes also
pre-check to avoid creating an orphan account before hitting the index.

## Code

| | |
|---|---|
| `lib/season.ts` | `getActiveSeason(clubId)` — the season everything resolves against; creates one if none exists. |
| `lib/roster.ts` | `addToRoster` / `updateMembership` / `removeFromRoster`. Maps Prisma `P2002` → jersey `ConflictError`. `removeFromRoster` sets the membership `FORMER` (never deletes). `playerTeamIdsSelect` / `playerTeamIds` / `playerAccessContext` / `rosterPlayerFilter` — the query fragments every reader uses to scope players by their live memberships. |
| Routes | `/api/v1/seasons{,/[id]}`, `/api/v1/teams/[id]/squads{,/[squadId]}`, `/api/v1/memberships/[id]`, reworked `/api/v1/teams/[id]/players{,/[playerId]}`. |
| Authz | subjects `Season` / `Squad` / `Membership` — admin manages, coach reads own team. |

## W4 part 2 — UI + reader migration (done)

- **jwt callback** now derives `teamIds` from `StaffAssignment` and a player's
  `teamId` from their active `TeamMembership` (deprecated columns are a fallback
  only). `TeamCoach` is no longer read anywhere.
- **Admin UI**: `/admin/teams/[id]` (`TeamManager` — season selector, roster with
  inline jersey/position/squad/status editing, add existing player or new
  account, remove, squads, staff, CSV export), `/admin/teams` list,
  `/admin/seasons` (`SeasonManager`). `/coach/my-teams/[id]` reuses `TeamManager`
  read-restricted.
- **Endpoints**: `POST /teams/:id/roster` (add existing), `GET
  /teams/:id/roster/export` (CSV, audit-logged), `GET|POST|DELETE
  /teams/:id/staff…`, `GET /players`, `GET /players/:id/memberships`.
- Approving a registration now creates the `TeamMembership`.

## W4 part 3 — drop the deprecated model (done)

Migration `20260828145344_drop_deprecated_org_fields`:

- **Dropped** `PlayerProfile.teamId / jerseyNumber / position / status`, the
  `TeamCoach` table, and the `PlayerStatus` enum. Every reader now goes through
  `TeamMembership` / `StaffAssignment` (see `lib/roster.ts` helpers).
- **Added** two advisory columns — `PlayerProfile.registrationTeamId`
  (FK, `ON DELETE SET NULL`) + `registrationPosition` — carrying *what the
  applicant asked for* at self-registration. They're read only by the
  registration screens (`/register`, `/admin/registrations`,
  `/registration-status`); once an admin approves, the real roster row is a
  `TeamMembership` created by `PATCH /api/v1/registrations/[id]`. The backfill
  copied the old `teamId` / `position` into them.
- `requirePlayerAccess` / `canViewPlayerContactDetails` now take a
  `PlayerRef = { id, teamIds }` — build it with `playerAccessContext(id)` or
  `{ id, teamIds: playerTeamIds(player) }` after selecting `playerTeamIdsSelect`.
- The self-registration form no longer asks for a jersey number; "position" is
  labelled a preference the coach confirms on the roster.
