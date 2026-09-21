-- CreateEnum
CREATE TYPE "FontSizePreference" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'XLARGE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "highContrast" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fontSizePreference" "FontSizePreference" NOT NULL DEFAULT 'MEDIUM';
