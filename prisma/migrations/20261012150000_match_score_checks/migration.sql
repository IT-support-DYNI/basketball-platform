-- Database backstops for the live-score and club-history rules, so seed
-- scripts, admin tools or a future route can't store a state the app
-- treats as impossible. The API enforces the same rules
-- (lib/live-score-state.ts, lib/contracts/event.ts, lib/contracts/team.ts).
-- A CHECK passes when its expression is NULL, so unset columns are fine.

ALTER TABLE "Event"
  ADD CONSTRAINT "Event_scores_in_range"
    CHECK ("ourScore" BETWEEN 0 AND 300 AND "opponentScore" BETWEEN 0 AND 300),
  ADD CONSTRAINT "Event_period_in_range"
    CHECK ("period" BETWEEN 1 AND 10),
  ADD CONSTRAINT "Event_period_only_in_play"
    CHECK ("period" IS NULL OR "liveStatus" IN ('LIVE', 'HALF_TIME')),
  ADD CONSTRAINT "Event_live_status_only_on_matches"
    CHECK ("liveStatus" IS NULL OR "type" IN ('MATCH', 'TOURNAMENT')),
  ADD CONSTRAINT "Event_started_match_has_scores"
    CHECK ("liveStatus" IS NULL OR "liveStatus" = 'UPCOMING'
           OR ("ourScore" IS NOT NULL AND "opponentScore" IS NOT NULL));

ALTER TABLE "PlayerProfile"
  ADD CONSTRAINT "PlayerProfile_previous_clubs_needs_yes"
    CHECK ("previousClubs" IS NULL OR "hasPreviousClub" IS TRUE);
