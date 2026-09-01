-- W6 part 2: versioned consent documents + append-only ConsentRecord.

-- CreateEnum
CREATE TYPE "ConsentDocumentType" AS ENUM ('CODE_OF_CONDUCT', 'PRIVACY_NOTICE', 'MEDIA_CONSENT', 'MEDICAL_CONSENT', 'DATA_PROCESSING', 'TRIP_CONSENT', 'OTHER');

-- CreateTable
CREATE TABLE "ConsentDocument" (
    "id" SERIAL NOT NULL,
    "clubId" INTEGER,
    "type" "ConsentDocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "requiredForPlayers" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentDocumentVersion" (
    "id" SERIAL NOT NULL,
    "documentId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentDocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" SERIAL NOT NULL,
    "documentVersionId" INTEGER NOT NULL,
    "playerProfileId" INTEGER NOT NULL,
    "acceptedByUserId" INTEGER NOT NULL,
    "byGuardian" BOOLEAN NOT NULL DEFAULT false,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsentDocument_clubId_active_idx" ON "ConsentDocument"("clubId", "active");

-- CreateIndex
CREATE INDEX "ConsentDocumentVersion_documentId_publishedAt_idx" ON "ConsentDocumentVersion"("documentId", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentDocumentVersion_documentId_version_key" ON "ConsentDocumentVersion"("documentId", "version");

-- CreateIndex
CREATE INDEX "ConsentRecord_playerProfileId_idx" ON "ConsentRecord"("playerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentRecord_documentVersionId_playerProfileId_key" ON "ConsentRecord"("documentVersionId", "playerProfileId");

-- AddForeignKey
ALTER TABLE "ConsentDocument" ADD CONSTRAINT "ConsentDocument_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentDocumentVersion" ADD CONSTRAINT "ConsentDocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ConsentDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "ConsentDocumentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_playerProfileId_fkey" FOREIGN KEY ("playerProfileId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_acceptedByUserId_fkey" FOREIGN KEY ("acceptedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

