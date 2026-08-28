-- W4 part 3: drop the deprecated season-scoped identity columns now that every
-- reader is on TeamMembership / StaffAssignment.

-- 1. New advisory columns for pre-approval registration intent.
ALTER TABLE "PlayerProfile"
  ADD COLUMN "registrationTeamId" INTEGER,
  ADD COLUMN "registrationPosition" "PlayerPosition";

-- 2. Backfill intent from the old columns before they go.
UPDATE "PlayerProfile"
SET "registrationTeamId" = "teamId",
    "registrationPosition" = "position"
WHERE "teamId" IS NOT NULL OR "position" IS NOT NULL;

-- 3. Drop the deprecated columns and their index / FK.
ALTER TABLE "PlayerProfile" DROP CONSTRAINT "PlayerProfile_teamId_fkey";
DROP INDEX "PlayerProfile_teamId_idx";
ALTER TABLE "PlayerProfile"
  DROP COLUMN "teamId",
  DROP COLUMN "jerseyNumber",
  DROP COLUMN "position",
  DROP COLUMN "status";

-- 4. TeamCoach is fully superseded by StaffAssignment.
ALTER TABLE "TeamCoach" DROP CONSTRAINT "TeamCoach_coachProfileId_fkey";
ALTER TABLE "TeamCoach" DROP CONSTRAINT "TeamCoach_teamId_fkey";
DROP TABLE "TeamCoach";

-- 5. PlayerStatus superseded by MembershipStatus.
DROP TYPE "PlayerStatus";

-- 6. FK for the new advisory column.
ALTER TABLE "PlayerProfile" ADD CONSTRAINT "PlayerProfile_registrationTeamId_fkey"
  FOREIGN KEY ("registrationTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
