-- CreateEnum
CREATE TYPE "MatchLiveStatus" AS ENUM ('UPCOMING', 'LIVE', 'HALF_TIME', 'FINAL');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "liveStatus" "MatchLiveStatus",
ADD COLUMN     "opponentName" TEXT,
ADD COLUMN     "opponentScore" INTEGER,
ADD COLUMN     "ourScore" INTEGER,
ADD COLUMN     "period" INTEGER,
ADD COLUMN     "scoreUpdatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PlayerProfile" ADD COLUMN     "hasPreviousClub" BOOLEAN,
ADD COLUMN     "previousClubs" TEXT,
ADD COLUMN     "publicShowQuote" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "quote" TEXT;

-- CreateIndex
CREATE INDEX "Event_liveStatus_idx" ON "Event"("liveStatus");
