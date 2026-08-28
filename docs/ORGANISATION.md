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

## Transitional (removed in W4 part 2)

- `PlayerProfile.teamId / jerseyNumber / position / status` — kept, marked
  `@deprecated`, still read by the session/jwt layer and by roster pages that
  query Prisma directly; synced by `lib/roster.ts`.
- `PlayerStatus` enum — superseded by `MembershipStatus`.
- `TeamCoach` — superseded by `StaffAssignment` (backfilled), still authoritative
  for the jwt callback's `teamIds` until its readers move.

## Still to build (W4 part 2)

Team / squad / season **admin UI**, staff-assignment UI, add-existing-player-to-
roster endpoint, historical membership view, roster **CSV export**; then migrate
the remaining readers off the deprecated columns and drop them.
