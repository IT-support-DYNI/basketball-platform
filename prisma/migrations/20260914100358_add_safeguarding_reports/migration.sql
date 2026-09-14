-- CreateEnum
CREATE TYPE "SafeguardingReportStatus" AS ENUM ('NEW', 'IN_REVIEW', 'RESOLVED');

-- AlterEnum
ALTER TYPE "NotificationCategory" ADD VALUE 'SAFEGUARDING';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'SAFEGUARDING_REPORT';

-- CreateTable
CREATE TABLE "SafeguardingReport" (
    "id" SERIAL NOT NULL,
    "clubId" INTEGER,
    "reporterName" TEXT,
    "reporterEmail" TEXT,
    "relationship" TEXT,
    "concernAbout" TEXT,
    "description" TEXT NOT NULL,
    "status" "SafeguardingReportStatus" NOT NULL DEFAULT 'NEW',
    "reviewedByUserId" INTEGER,
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafeguardingReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SafeguardingReport_status_idx" ON "SafeguardingReport"("status");

-- CreateIndex
CREATE INDEX "SafeguardingReport_clubId_idx" ON "SafeguardingReport"("clubId");

-- AddForeignKey
ALTER TABLE "SafeguardingReport" ADD CONSTRAINT "SafeguardingReport_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafeguardingReport" ADD CONSTRAINT "SafeguardingReport_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
