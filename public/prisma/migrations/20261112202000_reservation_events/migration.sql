CREATE TABLE "ReservationEvent" (
  "id" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "actorId" TEXT,
  "fromStatus" "TripStatus",
  "toStatus" "TripStatus" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReservationEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReservationEvent_tripId_createdAt_idx"
ON "ReservationEvent"("tripId", "createdAt");

CREATE INDEX "ReservationEvent_actorId_idx"
ON "ReservationEvent"("actorId");

ALTER TABLE "ReservationEvent"
ADD CONSTRAINT "ReservationEvent_tripId_fkey"
FOREIGN KEY ("tripId") REFERENCES "Trip"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReservationEvent"
ADD CONSTRAINT "ReservationEvent_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
