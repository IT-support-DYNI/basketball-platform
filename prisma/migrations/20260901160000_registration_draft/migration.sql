-- W6 part 4: server-saved, resumable registration drafts.

-- CreateEnum
CREATE TYPE "RegistrationDraftStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateTable
CREATE TABLE "RegistrationDraft" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "resumeToken" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'self',
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "data" JSONB NOT NULL DEFAULT '{}',
    "status" "RegistrationDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationDraft_email_key" ON "RegistrationDraft"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationDraft_resumeToken_key" ON "RegistrationDraft"("resumeToken");

