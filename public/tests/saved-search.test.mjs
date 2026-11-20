import test from "node:test";
import assert from "node:assert/strict";
import {
  SAVED_SEARCH_LIMIT,
  canSaveAnotherSearch,
  defaultSavedSearchName,
  normalizeSavedSearchInput,
  parseOptionalPositiveInt,
  savedSearchDeleteWhere,
} from "../src/lib/saved-search.js";

test("saved search normalization trims and bounds text and filters amenities", () => {
  const normalized = normalizeSavedSearchInput({
    name: "  Weekend cabin  ",
    query: "  mountain cabin  ",
    placeType: "  Cabin  ",
    guests: "4",
    maxPrice: "250",
    startsAt: "2026-12-01",
    endsAt: "2026-12-04",
    amenities: ["wifi", "wifi", "invalid", "parking"],
    sort: "price-asc",
  });

  assert.equal(normalized.name, "Weekend cabin");
  assert.equal(normalized.query, "mountain cabin");
  assert.equal(normalized.placeType, "Cabin");
  assert.equal(normalized.guests, 4);
  assert.equal(normalized.maxPrice, 250);
  assert.deepEqual(normalized.amenities, ["wifi", "parking"]);
  assert.equal(normalized.sort, "price-asc");
  assert.equal(normalized.startsAt.toISOString(), "2026-12-01T00:00:00.000Z");
  assert.equal(normalized.endsAt.toISOString(), "2026-12-04T00:00:00.000Z");
});

test("invalid sort and non-positive numeric filters normalize safely", () => {
  const normalized = normalizeSavedSearchInput({
    guests: "0",
    maxPrice: "-10",
    sort: "DROP TABLE",
  });

  assert.equal(normalized.guests, null);
  assert.equal(normalized.maxPrice, null);
  assert.equal(normalized.sort, "recommended");
  assert.equal(normalized.name, "Saved search");
  assert.equal(parseOptionalPositiveInt("not-a-number"), null);
});

test("saved search dates require a complete forward range", () => {
  assert.throws(
    () => normalizeSavedSearchInput({ startsAt: "2026-12-01" }),
    /valid check-in and check-out/
  );
  assert.throws(
    () =>
      normalizeSavedSearchInput({
        startsAt: "2026-12-05",
        endsAt: "2026-12-04",
      }),
    /valid check-in and check-out/
  );
});

test("default names follow useful search criteria priority", () => {
  assert.equal(
    defaultSavedSearchName({ query: "lake", placeType: "Cabin", guests: 4, maxPrice: 200 }),
    "lake"
  );
  assert.equal(
    defaultSavedSearchName({ query: "", placeType: "Cabin", guests: 4, maxPrice: 200 }),
    "Cabin stays"
  );
  assert.equal(
    defaultSavedSearchName({ query: "", placeType: "", guests: 4, maxPrice: 200 }),
    "Stays for 4+ guests"
  );
  assert.equal(
    defaultSavedSearchName({ query: "", placeType: "", guests: null, maxPrice: 200 }),
    "Stays up to $200/night"
  );
});

test("saved search limit and deletion predicate remain user scoped", () => {
  assert.equal(SAVED_SEARCH_LIMIT, 20);
  assert.equal(canSaveAnotherSearch(19), true);
  assert.equal(canSaveAnotherSearch(20), false);
  assert.equal(canSaveAnotherSearch(21), false);
  assert.deepEqual(
    savedSearchDeleteWhere({ savedSearchId: "search_1", userId: "user_1" }),
    { id: "search_1", userId: "user_1" }
  );
  assert.equal(
    savedSearchDeleteWhere({ savedSearchId: "search_1", userId: "" }),
    null
  );
});
