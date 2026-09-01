-- CreateEnum
CREATE TYPE "AttendanceMethod" AS ENUM ('COACH', 'QR', 'PIN');

-- DropForeignKey
ALTER TABLE "AttendanceRecord" DROP CONSTRAINT "AttendanceRecord_recordedByCoachId_fkey";

-- AlterTable
ALTER TABLE "AttendanceRecord" ADD COLUMN     "checkInAt" TIMESTAMP(3),
ADD COLUMN     "checkOutAt" TIMESTAMP(3),
ADD COLUMN     "method" "AttendanceMethod" NOT NULL DEFAULT 'COACH',
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedByCoachId" INTEGER,
ALTER COLUMN "recordedByCoachId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "AttendanceAudit" (
    "id" SERIAL NOT NULL,
    "recordId" INTEGER NOT NULL,
    "changedByUserId" INTEGER NOT NULL,
    "before" JSONB NOT NULL,
    "after" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QrCheckInToken" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QrCheckInToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AttendanceAudit_recordId_idx" ON "AttendanceAudit"("recordId");

-- CreateIndex
CREATE UNIQUE INDEX "QrCheckInToken_tokenHash_key" ON "QrCheckInToken"("tokenHash");

-- CreateIndex
CREATE INDEX "QrCheckInToken_eventId_idx" ON "QrCheckInToken"("eventId");

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_recordedByCoachId_fkey" FOREIGN KEY ("recordedByCoachId") REFERENCES "CoachProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_verifiedByCoachId_fkey" FOREIGN KEY ("verifiedByCoachId") REFERENCES "CoachProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceAudit" ADD CONSTRAINT "AttendanceAudit_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "AttendanceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceAudit" ADD CONSTRAINT "AttendanceAudit_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrCheckInToken" ADD CONSTRAINT "QrCheckInToken_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

