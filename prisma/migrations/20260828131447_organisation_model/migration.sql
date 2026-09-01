-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'INJURED', 'SUSPENDED', 'INACTIVE', 'TRIALIST', 'FORMER');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('HEAD_COACH', 'ASSISTANT_COACH', 'TEAM_MANAGER', 'STATISTICIAN', 'MEDICAL_OFFICER', 'WELFARE_OFFICER');

-- CreateTable
CREATE TABLE "Squad" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "ageGroup" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Squad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMembership" (
    "id" SERIAL NOT NULL,
    "playerProfileId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "squadId" INTEGER,
    "jerseyNumber" INTEGER,
    "position" "PlayerPosition",
    "secondaryPosition" "PlayerPosition",
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAssignment" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "seasonId" INTEGER,
    "role" "StaffRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Squad_seasonId_idx" ON "Squad"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "Squad_teamId_seasonId_name_key" ON "Squad"("teamId", "seasonId", "name");

-- CreateIndex
CREATE INDEX "TeamMembership_teamId_seasonId_idx" ON "TeamMembership"("teamId", "seasonId");

-- CreateIndex
CREATE INDEX "TeamMembership_seasonId_status_idx" ON "TeamMembership"("seasonId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMembership_playerProfileId_teamId_seasonId_key" ON "TeamMembership"("playerProfileId", "teamId", "seasonId");

-- CreateIndex
CREATE INDEX "StaffAssignment_teamId_idx" ON "StaffAssignment"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffAssignment_userId_teamId_role_seasonId_key" ON "StaffAssignment"("userId", "teamId", "role", "seasonId");

-- AddForeignKey
ALTER TABLE "Squad" ADD CONSTRAINT "Squad_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Squad" ADD CONSTRAINT "Squad_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_playerProfileId_fkey" FOREIGN KEY ("playerProfileId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "Squad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAssignment" ADD CONSTRAINT "StaffAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAssignment" ADD CONSTRAINT "StaffAssignment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAssignment" ADD CONSTRAINT "StaffAssignment_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Backfill: move season-scoped identity off PlayerProfile onto TeamMembership,
-- and mirror TeamCoach into StaffAssignment. Assumes one active season per club
-- (true for a single-club deployment). Legacy teams with a NULL clubId are
-- matched to the single active season if exactly one exists.
-- ─────────────────────────────────────────────────────────────────────────────

-- Resolve, per team, the season to backfill into: the active season of the
-- team's club, else the most-recent active season overall (covers legacy
-- NULL-club teams in a single-club deployment).
WITH team_season AS (
  SELECT t.id AS team_id,
         COALESCE(
           (SELECT s.id FROM "Season" s WHERE s."isActive" = true AND s."clubId" = t."clubId" ORDER BY s."startDate" DESC LIMIT 1),
           (SELECT s.id FROM "Season" s WHERE s."isActive" = true ORDER BY s."startDate" DESC LIMIT 1)
         ) AS season_id
  FROM "Team" t
)
INSERT INTO "TeamMembership"
  ("playerProfileId", "teamId", "seasonId", "jerseyNumber", "position", "status", "joinedAt", "createdAt", "updatedAt")
SELECT p.id, p."teamId", ts.season_id, p."jerseyNumber", p."position",
       (CASE p."status" WHEN 'ACTIVE' THEN 'ACTIVE' ELSE 'INACTIVE' END)::"MembershipStatus",
       now(), now(), now()
FROM "PlayerProfile" p
JOIN team_season ts ON ts.team_id = p."teamId"
WHERE p."teamId" IS NOT NULL
  AND ts.season_id IS NOT NULL
ON CONFLICT ("playerProfileId", "teamId", "seasonId") DO NOTHING;

-- Mirror existing coach assignments.
WITH team_season AS (
  SELECT t.id AS team_id,
         COALESCE(
           (SELECT s.id FROM "Season" s WHERE s."isActive" = true AND s."clubId" = t."clubId" ORDER BY s."startDate" DESC LIMIT 1),
           (SELECT s.id FROM "Season" s WHERE s."isActive" = true ORDER BY s."startDate" DESC LIMIT 1)
         ) AS season_id
  FROM "Team" t
)
INSERT INTO "StaffAssignment" ("userId", "teamId", "seasonId", "role", "createdAt")
SELECT cp."userId", tc."teamId", ts.season_id,
       (CASE WHEN tc."isPrimary" THEN 'HEAD_COACH' ELSE 'ASSISTANT_COACH' END)::"StaffRole",
       now()
FROM "TeamCoach" tc
JOIN "CoachProfile" cp ON cp.id = tc."coachProfileId"
LEFT JOIN team_season ts ON ts.team_id = tc."teamId"
ON CONFLICT ("userId", "teamId", "role", "seasonId") DO NOTHING;

-- The active-jersey rule: no two ACTIVE memberships share a jersey number in the
-- same team + season. Partial unique index (Prisma can't express this).
CREATE UNIQUE INDEX "TeamMembership_active_jersey_key"
  ON "TeamMembership" ("teamId", "seasonId", "jerseyNumber")
  WHERE "status" = 'ACTIVE' AND "jerseyNumber" IS NOT NULL;
