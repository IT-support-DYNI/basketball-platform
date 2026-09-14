-- CreateTable
CREATE TABLE "PlayerHighlight" (
    "id" SERIAL NOT NULL,
    "playerProfileId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerHighlight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerHighlight_playerProfileId_idx" ON "PlayerHighlight"("playerProfileId");

-- AddForeignKey
ALTER TABLE "PlayerHighlight" ADD CONSTRAINT "PlayerHighlight_playerProfileId_fkey" FOREIGN KEY ("playerProfileId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
