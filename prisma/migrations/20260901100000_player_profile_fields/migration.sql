-- W6: sensitive PlayerProfile fields (field-visibility engine strips these per viewer).

-- CreateEnum
CREATE TYPE "PreferredHand" AS ENUM ('LEFT', 'RIGHT', 'AMBIDEXTROUS');

-- AlterTable
ALTER TABLE "PlayerProfile" ADD COLUMN     "address" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "emergencyContactRelation" TEXT,
ADD COLUMN     "heightCm" INTEGER,
ADD COLUMN     "medicalNotes" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "preferredHand" "PreferredHand",
ADD COLUMN     "publicProfileApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "welfareNotes" TEXT;

