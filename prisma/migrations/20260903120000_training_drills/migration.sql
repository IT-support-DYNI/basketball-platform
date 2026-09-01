-- CreateEnum
CREATE TYPE "DrillCategory" AS ENUM ('WARMUP', 'BALL_HANDLING', 'PASSING', 'SHOOTING', 'FINISHING', 'DEFENSE', 'REBOUNDING', 'TRANSITION', 'SET_PLAYS', 'CONDITIONING', 'SCRIMMAGE', 'COOLDOWN', 'OTHER');
-- CreateEnum
CREATE TYPE "DrillDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');
-- CreateTable
CREATE TABLE "Drill" (
    "id" SERIAL NOT NULL,
    "clubId" INTEGER,
    "name" TEXT NOT NULL,
    "category" "DrillCategory" NOT NULL,
    "difficulty" "DrillDifficulty" NOT NULL DEFAULT 'INTERMEDIATE',
    "summary" TEXT,
    "instructions" TEXT,
    "coachingPoints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "commonMistakes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "durationMinutes" INTEGER,
    "minPlayers" INTEGER,
    "maxPlayers" INTEGER,
    "equipment" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "courtDiagram" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdByUserId" INTEGER,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Drill_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "Drill_clubId_category_idx" ON "Drill"("clubId", "category");
-- AddForeignKey
ALTER TABLE "Drill" ADD CONSTRAINT "Drill_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Drill" ADD CONSTRAINT "Drill_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
