-- W5 part 3: RSVP (AvailabilityResponse) + a per-event reminder marker.
CREATE TYPE "RsvpResponse" AS ENUM ('ATTENDING', 'NOT_ATTENDING', 'UNSURE');

ALTER TABLE "Event" ADD COLUMN "rsvpReminderSentAt" TIMESTAMP(3);

CREATE TABLE "AvailabilityResponse" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "response" "RsvpResponse" NOT NULL,
    "note" TEXT,
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AvailabilityResponse_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AvailabilityResponse_eventId_idx" ON "AvailabilityResponse"("eventId");
CREATE UNIQUE INDEX "AvailabilityResponse_eventId_userId_key" ON "AvailabilityResponse"("eventId", "userId");
ALTER TABLE "AvailabilityResponse" ADD CONSTRAINT "AvailabilityResponse_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AvailabilityResponse" ADD CONSTRAINT "AvailabilityResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
