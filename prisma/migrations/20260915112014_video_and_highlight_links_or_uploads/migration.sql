-- AlterTable
ALTER TABLE "PlayerHighlight" ADD COLUMN     "storageKey" TEXT,
ALTER COLUMN "url" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "externalUrl" TEXT,
ALTER COLUMN "key" DROP NOT NULL;
