-- CreateTable
CREATE TABLE "PlayerPhoto" (
    "id" SERIAL NOT NULL,
    "playerProfileId" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerPhoto_playerProfileId_idx" ON "PlayerPhoto"("playerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerPhoto_playerProfileId_storageKey_key" ON "PlayerPhoto"("playerProfileId", "storageKey");

-- AddForeignKey
ALTER TABLE "PlayerPhoto" ADD CONSTRAINT "PlayerPhoto_playerProfileId_fkey" FOREIGN KEY ("playerProfileId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
