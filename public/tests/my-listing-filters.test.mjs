import test from "node:test";
import assert from "node:assert/strict";
import {
  filterMyListings,
  myListingsHref,
  normalizeMyListingQuery,
  normalizeMyListingStatus,
} from "../src/lib/my-listing-filters.js";

const listings = [
  {
    id: "a",
    title: "Blue Ridge Cabin",
    location: "Ellijay, GA",
    placeType: "Cabin",
    active: true,
  },
  {
    id: "b",
    title: "Beach Condo",
    location: "Myrtle Beach, SC",
    placeType: "Condo",
    active: false,
  },
  {
    id: "c",
    title: "Downtown Loft",
    location: "Charlotte, NC",
    placeType: "Apartment",
    active: true,
  },
];

test("listing status and query filters normalize safely", () => {
  assert.equal(normalizeMyListingStatus("paused"), "PAUSED");
  assert.equal(normalizeMyListingStatus("unknown"), "ALL");
  assert.equal(normalizeMyListingQuery("  cabin  "), "cabin");
  assert.equal(normalizeMyListingQuery("x".repeat(200)).length, 120);
});

test("listing search matches title, location, or stay type case-insensitively", () => {
  assert.deepEqual(
    filterMyListings(listings, { query: "ellijay" }).map((item) => item.id),
    ["a"]
  );
  assert.deepEqual(
    filterMyListings(listings, { query: "CONDO" }).map((item) => item.id),
    ["b"]
  );
  assert.deepEqual(
    filterMyListings(listings, { query: "apartment" }).map((item) => item.id),
    ["c"]
  );
});

test("listing active/paused filters compose with search", () => {
  assert.deepEqual(
    filterMyListings(listings, { status: "ACTIVE" }).map((item) => item.id),
    ["a", "c"]
  );
  assert.deepEqual(
    filterMyListings(listings, { status: "PAUSED" }).map((item) => item.id),
    ["b"]
  );
  assert.deepEqual(
    filterMyListings(listings, { query: "beach", status: "ACTIVE" }),
    []
  );
});

test("listing filter links preserve query and status independently", () => {
  assert.equal(myListingsHref(), "/my-listings");
  assert.equal(
    myListingsHref({ query: "cabin" }),
    "/my-listings?q=cabin"
  );
  assert.equal(
    myListingsHref({ status: "PAUSED" }),
    "/my-listings?status=PAUSED"
  );
  assert.equal(
    myListingsHref({ query: "blue ridge", status: "ACTIVE" }),
    "/my-listings?q=blue+ridge&status=ACTIVE"
  );
});
