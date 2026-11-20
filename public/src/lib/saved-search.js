import { parseAmenities } from "./amenities.js";
import { parseDateInput } from "./pricing.js";

export const SAVED_SEARCH_LIMIT = 20;
export const SAVED_SEARCH_SORTS = Object.freeze([
  "recommended",
  "rating",
  "price-asc",
  "price-desc",
]);

export function parseOptionalPositiveInt(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function defaultSavedSearchName({ query, placeType, guests, maxPrice }) {
  if (query) return query.slice(0, 80);
  if (placeType) return `${placeType} stays`.slice(0, 80);
  if (guests) return `Stays for ${guests}+ guests`;
  if (maxPrice) return `Stays up to $${maxPrice}/night`;
  return "Saved search";
}

export function normalizeSavedSearchInput(input = {}) {
  const query = String(input.query ?? "").trim().slice(0, 200);
  const placeType = String(input.placeType ?? "").trim().slice(0, 100);
  const guests = parseOptionalPositiveInt(input.guests);
  const maxPrice = parseOptionalPositiveInt(input.maxPrice);
  const startsAt = parseDateInput(input.startsAt);
  const endsAt = parseDateInput(input.endsAt);
  const amenities = parseAmenities(input.amenities ?? []);
  const requestedSort = String(input.sort ?? "recommended");
  const sort = SAVED_SEARCH_SORTS.includes(requestedSort)
    ? requestedSort
    : "recommended";
  const requestedName = String(input.name ?? "").trim().slice(0, 80);
  const name =
    requestedName ||
    defaultSavedSearchName({ query, placeType, guests, maxPrice });

  const hasPartialDates = Boolean(startsAt) !== Boolean(endsAt);
  const hasReversedDates = Boolean(startsAt && endsAt && endsAt <= startsAt);

  if (hasPartialDates || hasReversedDates) {
    throw new Error("Saved-search dates must include a valid check-in and check-out.");
  }

  return {
    name,
    query: query || null,
    placeType: placeType || null,
    guests,
    maxPrice,
    startsAt,
    endsAt,
    amenities,
    sort,
  };
}

export function savedSearchDeleteWhere({ savedSearchId, userId }) {
  if (!savedSearchId || !userId) return null;
  return { id: savedSearchId, userId };
}

export function canSaveAnotherSearch(existingCount) {
  return Number.isInteger(existingCount) && existingCount < SAVED_SEARCH_LIMIT;
}
