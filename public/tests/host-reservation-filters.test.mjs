import test from "node:test";
import assert from "node:assert/strict";
import {
  hostReservationsHref,
  hostedReservationsWhere,
  normalizeHostListingFilter,
  normalizeHostReservationStatus,
} from "../src/lib/host-reservation-filters.js";

test("host reservation status filter normalizes safely", () => {
  assert.equal(normalizeHostReservationStatus("confirmed"), "CONFIRMED");
  assert.equal(normalizeHostReservationStatus("unexpected"), "ALL");
  assert.equal(normalizeHostReservationStatus(null), "ALL");
});

test("host listing filter only accepts listings owned by the host", () => {
  const owned = ["listing-a", "listing-b"];
  assert.equal(normalizeHostListingFilter("listing-a", owned), "listing-a");
  assert.equal(normalizeHostListingFilter("other-listing", owned), "ALL");
  assert.equal(normalizeHostListingFilter("", owned), "ALL");
});

test("host reservation query remains scoped to host and selected listing", () => {
  assert.deepEqual(
    hostedReservationsWhere({
      hostId: "host-1",
      status: "PENDING",
      listingId: "listing-a",
    }),
    {
      listing: { ownerId: "host-1", id: "listing-a" },
      status: "PENDING",
    }
  );

  assert.deepEqual(
    hostedReservationsWhere({
      hostId: "host-1",
      status: "ALL",
      listingId: "ALL",
    }),
    {
      listing: { ownerId: "host-1" },
    }
  );
});

test("host reservation links preserve independent status and listing filters", () => {
  assert.equal(hostReservationsHref(), "/host/reservations");
  assert.equal(
    hostReservationsHref({ status: "CONFIRMED", listingId: "ALL" }),
    "/host/reservations?status=CONFIRMED"
  );
  assert.equal(
    hostReservationsHref({ status: "ALL", listingId: "listing-a" }),
    "/host/reservations?listing=listing-a"
  );
  assert.equal(
    hostReservationsHref({ status: "PENDING", listingId: "listing-a" }),
    "/host/reservations?status=PENDING&listing=listing-a"
  );
});
