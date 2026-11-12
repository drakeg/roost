CREATE TABLE "ListingBlock" (
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ListingBlock_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ListingBlock_listingId_idx" ON "ListingBlock"("listingId");
CREATE INDEX "ListingBlock_startsAt_idx" ON "ListingBlock"("startsAt");
CREATE INDEX "ListingBlock_endsAt_idx" ON "ListingBlock"("endsAt");

ALTER TABLE "ListingBlock"
ADD CONSTRAINT "ListingBlock_listingId_fkey"
FOREIGN KEY ("listingId") REFERENCES "Listing"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
