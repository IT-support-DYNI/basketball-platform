-- AlterTable
ALTER TABLE "CoachProfile" ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "publicProfileApproved" BOOLEAN NOT NULL DEFAULT false;
