-- CreateEnum
CREATE TYPE "TrainingPlanStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TrainingBlockCategory" AS ENUM ('WARMUP', 'SKILL', 'TACTICAL', 'CONDITIONING', 'SCRIMMAGE', 'COOLDOWN', 'OTHER');

-- CreateTable
CREATE TABLE "TrainingPlan" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "squadId" INTEGER,
    "title" TEXT NOT NULL,
    "objectives" TEXT,
    "date" TIMESTAMP(3),
    "status" "TrainingPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "coachingNotes" TEXT,
    "eventId" INTEGER,
    "effectivenessRating" INTEGER,
    "postSessionNotes" TEXT,
    "templateOfId" INTEGER,
    "createdByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingBlock" (
    "id" SERIAL NOT NULL,
    "trainingPlanId" INTEGER NOT NULL,
    "category" "TrainingBlockCategory" NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT,
    "durationMinutes" INTEGER,
    "notes" TEXT,
    "drillId" INTEGER,

    CONSTRAINT "TrainingBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainingPlan_eventId_key" ON "TrainingPlan"("eventId");

-- CreateIndex
CREATE INDEX "TrainingPlan_teamId_seasonId_idx" ON "TrainingPlan"("teamId", "seasonId");

-- CreateIndex
CREATE INDEX "TrainingPlan_teamId_date_idx" ON "TrainingPlan"("teamId", "date");

-- CreateIndex
CREATE INDEX "TrainingBlock_trainingPlanId_order_idx" ON "TrainingBlock"("trainingPlanId", "order");

-- AddForeignKey
ALTER TABLE "TrainingPlan" ADD CONSTRAINT "TrainingPlan_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingPlan" ADD CONSTRAINT "TrainingPlan_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingPlan" ADD CONSTRAINT "TrainingPlan_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "Squad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingPlan" ADD CONSTRAINT "TrainingPlan_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingPlan" ADD CONSTRAINT "TrainingPlan_templateOfId_fkey" FOREIGN KEY ("templateOfId") REFERENCES "TrainingPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingPlan" ADD CONSTRAINT "TrainingPlan_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingBlock" ADD CONSTRAINT "TrainingBlock_trainingPlanId_fkey" FOREIGN KEY ("trainingPlanId") REFERENCES "TrainingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingBlock" ADD CONSTRAINT "TrainingBlock_drillId_fkey" FOREIGN KEY ("drillId") REFERENCES "Drill"("id") ON DELETE SET NULL ON UPDATE CASCADE;
