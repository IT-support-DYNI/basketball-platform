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
| `lib/roster.ts` | `addToRoster` / `updateMembership` / `removeFromRoster`. Maps Prisma `P2002` → jersey `ConflictError`. `removeFromRoster` sets the membership `FORMER` (never deletes). Keeps the deprecated `PlayerProfile` columns in sync. |
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

## Transitional (drop in W4 part 3)

- `PlayerProfile.teamId / jerseyNumber / position / status` — kept, `@deprecated`,
  synced by `lib/roster.ts`. Still read by a few directory-style list pages
  (`/coach/players`, `/admin/players`, `/admin/registrations`) and written by
  `/api/v1/register` + `players/[id]` PATCH as pre-approval intent.
- `PlayerStatus` enum — superseded by `MembershipStatus`.
- `TeamCoach` table — superseded by `StaffAssignment`, no longer read; safe to
  drop once those list pages move.

W4 part 3: migrate the last list pages, then a `DROP COLUMN` / `DROP TABLE`
migration.
