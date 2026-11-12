CREATE TABLE "ReservationMessage" (
  "id" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReservationMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReservationMessage_tripId_createdAt_idx"
ON "ReservationMessage"("tripId", "createdAt");

CREATE INDEX "ReservationMessage_senderId_idx"
ON "ReservationMessage"("senderId");

ALTER TABLE "ReservationMessage"
ADD CONSTRAINT "ReservationMessage_tripId_fkey"
FOREIGN KEY ("tripId") REFERENCES "Trip"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReservationMessage"
ADD CONSTRAINT "ReservationMessage_senderId_fkey"
FOREIGN KEY ("senderId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
