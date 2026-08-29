-- W5 part 1: TrainingSession becomes the general Event model; add Venue +
-- EventRecurrence. TrainingSession ids are carried over as Event ids so the
-- existing AttendanceRecord / Feedback rows map straight across.

-- 1. Enums --------------------------------------------------------------------
CREATE TYPE "EventStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'POSTPONED');
CREATE TYPE "EventType" AS ENUM ('TRAINING', 'MATCH', 'TOURNAMENT', 'TEAM_MEETING', 'FITNESS_TEST', 'SOCIAL', 'MEDICAL', 'REGISTRATION_DEADLINE', 'PAYMENT_DEADLINE', 'OTHER');
CREATE TYPE "EventVisibility" AS ENUM ('TEAM', 'CLUB', 'PUBLIC');
CREATE TYPE "RecurrenceFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- 2. New tables -------------------------------------------------------------
CREATE TABLE "Venue" (
    "id" SERIAL NOT NULL,
    "clubId" INTEGER,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "mapLat" DOUBLE PRECISION,
    "mapLng" DOUBLE PRECISION,
    "notes" TEXT,
    "checkInPin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventRecurrence" (
    "id" SERIAL NOT NULL,
    "frequency" "RecurrenceFrequency" NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "byWeekday" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "until" TIMESTAMP(3),
    "count" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventRecurrence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Event" (
    "id" INTEGER NOT NULL,
    "teamId" INTEGER,
    "type" "EventType" NOT NULL DEFAULT 'TRAINING',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "venueId" INTEGER,
    "locationText" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "arrivalTime" TIMESTAMP(3),
    "rsvpDeadline" TIMESTAMP(3),
    "capacity" INTEGER,
    "dressCode" TEXT,
    "visibility" "EventVisibility" NOT NULL DEFAULT 'TEAM',
    "status" "EventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "recurrenceId" INTEGER,
    "createdByUserId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- 3. Backfill Event from TrainingSession ----------------------------------
INSERT INTO "Event" (
    "id", "teamId", "type", "title", "description", "locationText",
    "startAt", "endAt", "status", "createdByUserId", "createdAt", "updatedAt"
)
SELECT
    ts."id",
    ts."teamId",
    'TRAINING'::"EventType",
    ts."title",
    ts."notes",
    ts."location",
    date_trunc('day', ts."date")::timestamp + ts."startTime"::time,
    date_trunc('day', ts."date")::timestamp + ts."endTime"::time
        + CASE WHEN ts."endTime"::time <= ts."startTime"::time
               THEN interval '1 day' ELSE interval '0' END,
    ts."status"::text::"EventStatus",
    cp."userId",
    ts."createdAt",
    ts."updatedAt"
FROM "TrainingSession" ts
JOIN "CoachProfile" cp ON cp."id" = ts."createdByCoachId";

-- Event ids are seeded from TrainingSession ids above; move the sequence past them.
CREATE SEQUENCE IF NOT EXISTS "Event_id_seq" OWNED BY "Event"."id";
ALTER TABLE "Event" ALTER COLUMN "id" SET DEFAULT nextval('"Event_id_seq"');
SELECT setval('"Event_id_seq"', COALESCE((SELECT MAX("id") FROM "Event"), 0) + 1, false);

-- 4. AttendanceRecord.sessionId -> eventId --------------------------------
ALTER TABLE "AttendanceRecord" DROP CONSTRAINT "AttendanceRecord_sessionId_fkey";
DROP INDEX "AttendanceRecord_sessionId_playerId_key";
ALTER TABLE "AttendanceRecord" ADD COLUMN "eventId" INTEGER;
UPDATE "AttendanceRecord" SET "eventId" = "sessionId";
ALTER TABLE "AttendanceRecord" ALTER COLUMN "eventId" SET NOT NULL;
ALTER TABLE "AttendanceRecord" DROP COLUMN "sessionId";
CREATE UNIQUE INDEX "AttendanceRecord_eventId_playerId_key" ON "AttendanceRecord"("eventId", "playerId");

-- 5. Feedback.sessionId -> eventId ---------------------------------------
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_sessionId_fkey";
ALTER TABLE "Feedback" ADD COLUMN "eventId" INTEGER;
UPDATE "Feedback" SET "eventId" = "sessionId";
ALTER TABLE "Feedback" DROP COLUMN "sessionId";

-- 6. Drop the old model --------------------------------------------------
ALTER TABLE "TrainingSession" DROP CONSTRAINT "TrainingSession_createdByCoachId_fkey";
ALTER TABLE "TrainingSession" DROP CONSTRAINT "TrainingSession_teamId_fkey";
DROP TABLE "TrainingSession";
DROP TYPE "SessionStatus";

-- 7. Indexes + FKs -----------------------------------------------------
CREATE INDEX "Venue_clubId_idx" ON "Venue"("clubId");
CREATE INDEX "Event_teamId_startAt_idx" ON "Event"("teamId", "startAt");
CREATE INDEX "Event_startAt_idx" ON "Event"("startAt");
CREATE INDEX "Event_recurrenceId_idx" ON "Event"("recurrenceId");

ALTER TABLE "Venue" ADD CONSTRAINT "Venue_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_recurrenceId_fkey" FOREIGN KEY ("recurrenceId") REFERENCES "EventRecurrence"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
