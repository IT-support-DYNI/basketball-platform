-- W7 part 1: announcement acknowledgement + pinning.

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "pinnedUntil" TIMESTAMP(3),
ADD COLUMN     "requiresAck" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AnnouncementAck" (
    "id" SERIAL NOT NULL,
    "announcementId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementAck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnnouncementAck_userId_idx" ON "AnnouncementAck"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementAck_announcementId_userId_key" ON "AnnouncementAck"("announcementId", "userId");

-- AddForeignKey
ALTER TABLE "AnnouncementAck" ADD CONSTRAINT "AnnouncementAck_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementAck" ADD CONSTRAINT "AnnouncementAck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

