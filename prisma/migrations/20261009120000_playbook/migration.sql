-- CreateEnum
CREATE TYPE "PlayType" AS ENUM ('OFFENCE', 'DEFENCE', 'INBOUND', 'PRESS_BREAK', 'SPECIAL');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'NEW_PLAY';

-- AlterEnum
ALTER TYPE "NotificationCategory" ADD VALUE 'PLAYBOOK';

-- CreateTable
CREATE TABLE "Play" (
    "id" SERIAL NOT NULL,
    "clubId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PlayType" NOT NULL DEFAULT 'OFFENCE',
    "notes" TEXT,
    "courtDiagram" JSONB,
    "createdByUserId" INTEGER,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Play_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayAssignment" (
    "id" SERIAL NOT NULL,
    "playId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "assignedByUserId" INTEGER,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Play_clubId_type_idx" ON "Play"("clubId", "type");

-- CreateIndex
CREATE INDEX "PlayAssignment_teamId_idx" ON "PlayAssignment"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayAssignment_playId_teamId_key" ON "PlayAssignment"("playId", "teamId");

-- AddForeignKey
ALTER TABLE "Play" ADD CONSTRAINT "Play_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Play" ADD CONSTRAINT "Play_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayAssignment" ADD CONSTRAINT "PlayAssignment_playId_fkey" FOREIGN KEY ("playId") REFERENCES "Play"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayAssignment" ADD CONSTRAINT "PlayAssignment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayAssignment" ADD CONSTRAINT "PlayAssignment_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

