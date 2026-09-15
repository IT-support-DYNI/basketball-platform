-- AlterTable
ALTER TABLE "PlayerProfile" ADD COLUMN     "publicShowBio" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publicShowHighlights" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publicShowPhoto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publicShowStats" BOOLEAN NOT NULL DEFAULT false;
