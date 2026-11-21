import test from "node:test";
import assert from "node:assert/strict";
import {
  hostCalendarHref,
  normalizeHostListingFilter,
} from "../src/lib/host-calendar-filters.js";

test("calendar listing filter only accepts host-owned listing ids", () => {
  const owned = ["listing-a", "listing-b"];
  assert.equal(normalizeHostListingFilter("listing-b", owned), "listing-b");
  assert.equal(normalizeHostListingFilter("other", owned), "ALL");
});

test("calendar links preserve month and property filters", () => {
  assert.equal(hostCalendarHref(), "/host/calendar");
  assert.equal(
    hostCalendarHref({ month: "2026-11" }),
    "/host/calendar?month=2026-11"
  );
  assert.equal(
    hostCalendarHref({ listingId: "listing-a" }),
    "/host/calendar?listing=listing-a"
  );
  assert.equal(
    hostCalendarHref({ month: "2026-12", listingId: "listing-a" }),
    "/host/calendar?month=2026-12&listing=listing-a"
  );
});
