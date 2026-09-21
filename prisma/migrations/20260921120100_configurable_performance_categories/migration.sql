-- Performance categories move from a fixed enum to an admin-configurable
-- table (Platform-wide settings > Performance categories), so a club can
-- rename, reorder, add or retire the categories coaches score players on.

-- CreateTable
CREATE TABLE "PerformanceCategoryDefinition" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceCategoryDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceCategoryDefinition_key_key" ON "PerformanceCategoryDefinition"("key");

-- CreateIndex
CREATE INDEX "PerformanceCategoryDefinition_isActive_sortOrder_idx" ON "PerformanceCategoryDefinition"("isActive", "sortOrder");

-- Seed the 8 categories that used to be the fixed PerformanceCategory enum,
-- in their original order — this gives the backfill below something to
-- point existing PerformanceCategoryScore rows at.
INSERT INTO "PerformanceCategoryDefinition" ("key", "label", "sortOrder", "updatedAt") VALUES
  ('SHOOTING', 'Shooting', 0, CURRENT_TIMESTAMP),
  ('DEFENSE', 'Defense', 1, CURRENT_TIMESTAMP),
  ('PASSING', 'Passing', 2, CURRENT_TIMESTAMP),
  ('BALL_HANDLING', 'Ball handling', 3, CURRENT_TIMESTAMP),
  ('FITNESS', 'Fitness', 4, CURRENT_TIMESTAMP),
  ('TEAMWORK', 'Teamwork', 5, CURRENT_TIMESTAMP),
  ('EFFORT', 'Effort', 6, CURRENT_TIMESTAMP),
  ('DISCIPLINE', 'Discipline', 7, CURRENT_TIMESTAMP);

-- AlterTable: add the new FK column nullable first so existing rows can be
-- backfilled before it's required.
ALTER TABLE "PerformanceCategoryScore" ADD COLUMN "categoryId" INTEGER;

-- Backfill every existing score from its old enum value to the matching
-- definition row.
UPDATE "PerformanceCategoryScore" AS pcs
SET "categoryId" = pcd."id"
FROM "PerformanceCategoryDefinition" AS pcd
WHERE pcd."key" = pcs."category"::text;

-- Every row now has a categoryId — enforce it.
ALTER TABLE "PerformanceCategoryScore" ALTER COLUMN "categoryId" SET NOT NULL;

-- Drop the old enum-backed unique constraint and its column.
ALTER TABLE "PerformanceCategoryScore" DROP CONSTRAINT IF EXISTS "PerformanceCategoryScore_evaluationId_category_key";
ALTER TABLE "PerformanceCategoryScore" DROP COLUMN "category";
DROP TYPE "PerformanceCategory";

-- New unique constraint on the FK column.
CREATE UNIQUE INDEX "PerformanceCategoryScore_evaluationId_categoryId_key" ON "PerformanceCategoryScore"("evaluationId", "categoryId");

-- AddForeignKey
ALTER TABLE "PerformanceCategoryScore" ADD CONSTRAINT "PerformanceCategoryScore_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PerformanceCategoryDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
