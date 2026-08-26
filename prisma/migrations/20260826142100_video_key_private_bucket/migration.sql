/*
  Warnings:

  - You are about to drop the column `thumbnailUrl` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Video` table. All the data in the column will be lost.
  - Added the required column `key` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Video" DROP COLUMN "thumbnailUrl",
DROP COLUMN "url",
ADD COLUMN     "key" TEXT NOT NULL,
ADD COLUMN     "thumbnailKey" TEXT;
