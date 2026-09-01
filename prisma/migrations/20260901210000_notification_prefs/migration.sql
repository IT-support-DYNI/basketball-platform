-- W7 part 2: notification category + de-dupe key + per-user channel preferences.

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('SCHEDULE', 'ANNOUNCEMENTS', 'PERFORMANCE', 'VIDEOS', 'REGISTRATION', 'MESSAGES');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "category" "NotificationCategory" NOT NULL DEFAULT 'ANNOUNCEMENTS',
ADD COLUMN     "dedupeKey" TEXT;

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "email" BOOLEAN NOT NULL DEFAULT false,
    "push" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_category_key" ON "NotificationPreference"("userId", "category");

-- CreateIndex
CREATE INDEX "Notification_userId_dedupeKey_idx" ON "Notification"("userId", "dedupeKey");

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

