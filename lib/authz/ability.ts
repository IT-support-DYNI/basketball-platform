import { AbilityBuilder, createMongoAbility, type MongoAbility } from "@casl/ability";

import type { Principal, RoleAssignment } from "./roles";

/**
 * The authorization policy — the single place that answers "may this caller do
 * X to Y?". Route handlers never re-derive this logic; they call
 * `authorize(session)` / `requireAbility(...)` (see ./guard).
 *
 * This is "layer 2" of the two-layer model (ARCHITECTURE.md §3.2): resource-
 * and field-level rules. The coarse role gate is `requireRole` in ./guard.
 */

/** Actions. `access` is the generic "may touch anything scoped to this team". */
export type Action =
  | "manage"
  | "create"
  | "read"
  | "update"
  | "delete"
  | "access"
  | "record"
  | "verify"
  | "approve"
  | "moderate"
  | "export";

/** Subject names. `PlayerContact` / `PlayerMedical` / `PlayerWelfare` are the
 *  sensitive field groups on a player, kept as separate subjects so the
 *  field-visibility engine (W5) reads off the same policy. */
export type Subject =
  | "Team"
  | "Season"
  | "Squad"
  | "Membership"
  | "PlayerProfile"
  | "PlayerContact"
  | "PlayerMedical"
  | "PlayerWelfare"
  | "Event"
  | "Venue"
  | "Attendance"
  | "Announcement"
  | "Video"
  | "Evaluation"
  | "Feedback"
  | "Notification"
  | "User"
  | "Registration"
  | "Club"
  | "all";

export type AppAbility = MongoAbility<[Action, Subject | Record<string, unknown>]>;

export function defineAbilityFor(principal: Principal): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  for (const assignment of principal.assignments) {
    applyRole(assignment, principal, can, cannot);
  }

  // Resources are passed either as a bare subject-name string or via CASL's
  // `subject('Team', { … })` helper; the default detection handles both.
  return build();
}

type Can = AbilityBuilder<AppAbility>["can"];
type Cannot = AbilityBuilder<AppAbility>["cannot"];

function applyRole(
  { role, scope }: RoleAssignment,
  principal: Principal,
  can: Can,
  cannot: Cannot,
) {
  const { userId, playerId } = principal;

  switch (role) {
    case "SUPER_ADMIN": {
      can("manage", "all");
      break;
    }

    case "CLUB_ADMIN": {
      // One club today → unscoped. When scope.clubId is populated this narrows
      // to `{ clubId: scope.clubId }` on every subject.
      if (scope.clubId == null) {
        can("manage", "all");
      } else {
        can("manage", "all", { clubId: scope.clubId });
        can("manage", "Club", { id: scope.clubId });
      }
      break;
    }

    case "HEAD_COACH":
    case "ASSISTANT_COACH": {
      const teamId = scope.teamId;
      if (teamId == null) {
        // Club-wide "is a coach" assignment — no resource rights on its own.
        // Video authoring isn't team-scoped in the current data model.
        can(["read", "create", "update", "delete"], "Video");
        break;
      }

      can("access", "Team", { id: teamId });
      can("read", "Team", { id: teamId });
      can("read", "Season");
      can("read", ["Squad", "Membership"], { teamId });

      can(["read", "create", "update", "delete"], "Event", { teamId });
      can("read", "Event", { teamId: null }); // club-wide events
      can("read", "Venue");
      can(["read", "record", "verify"], "Attendance", { teamId });

      can("read", "PlayerProfile", { teamId });
      can("read", "PlayerContact", { teamId });
      can("update", "PlayerProfile", { teamId });

      can(["read", "create", "update", "delete"], "Evaluation", { teamId });
      can(["read", "create", "update", "delete"], "Feedback", { teamId });

      can(["read", "create"], "Announcement", { teamId });
      // Coaches may only edit / remove announcements they authored.
      can(["update", "delete"], "Announcement", { teamId, authorUserId: userId });

      if (role === "ASSISTANT_COACH") {
        // No roster / status changes for assistants (configurable per club later).
        cannot("update", "PlayerProfile");
      }
      break;
    }

    case "TEAM_MANAGER": {
      const teamId = scope.teamId;
      if (teamId == null) break;
      can("access", "Team", { id: teamId });
      can("read", "Team", { id: teamId });
      can(["read", "create", "update"], "Event", { teamId });
      can("read", "Event", { teamId: null });
      can("read", "Venue");
      can(["read", "record"], "Attendance", { teamId });
      can("read", "PlayerProfile", { teamId });
      can(["read", "create"], "Announcement", { teamId });
      cannot("read", "PlayerContact");
      cannot("read", "PlayerMedical");
      cannot("read", "PlayerWelfare");
      break;
    }

    case "WELFARE_OFFICER": {
      can("read", "PlayerWelfare");
      can("read", "PlayerProfile");
      can(["read", "moderate"], "Announcement");
      can("read", "Registration");
      cannot(["update", "delete"], "Evaluation");
      cannot("record", "Attendance");
      break;
    }

    case "MEDICAL_OFFICER": {
      can(["read", "create", "update"], "PlayerMedical");
      can("read", "PlayerProfile");
      cannot("read", "Announcement");
      break;
    }

    case "STATISTICIAN": {
      const teamId = scope.teamId;
      can("read", "PlayerProfile", teamId != null ? { teamId } : {});
      // Records game/shot events during assigned matches (Match subjects land
      // with the Phase 2 stats module); no historical edits.
      cannot("update", "Evaluation");
      break;
    }

    case "PLAYER": {
      const ownTeamId = scope.teamId;

      if (ownTeamId != null) {
        can("access", "Team", { id: ownTeamId });
        can("read", "Team", { id: ownTeamId });
        can("read", ["Squad", "Membership"], { teamId: ownTeamId });
        can("read", "Event", { teamId: ownTeamId });
        can("read", "Announcement", { teamId: ownTeamId });
      }
      can("read", "Event", { teamId: null }); // club-wide events
      can("read", "Venue");
      can("read", "Announcement", { scope: "PLATFORM" });

      // Own profile only (roster listings go through Team access, not this).
      // Read own record; update contact details only.
      if (playerId != null) {
        can("read", "PlayerProfile", { id: playerId });
        can("update", "PlayerContact", { id: playerId });
        can("read", "Attendance", { playerId });
        can("read", "Evaluation", { playerId });
        can("read", "Feedback", { playerId });
      }

      can(["read", "update"], "Notification", { userId });

      // Explicit denials — the record of the game / a coach's assessment is not
      // the player's to change (brief §17).
      cannot(["create", "update", "delete"], "Evaluation");
      cannot(["record", "verify"], "Attendance");
      cannot(["create", "update", "delete"], "Event");
      cannot(["update", "delete"], "PlayerProfile");
      break;
    }

    case "GUARDIAN": {
      // The guardian's own login experience is a later increment; for now they
      // inherit read access to their linked child's data via the same rules
      // keyed on that child's playerId (populated when GuardianRelationship is
      // wired into the session).
      break;
    }

    case "SUPPORTER":
      break;
  }
}
