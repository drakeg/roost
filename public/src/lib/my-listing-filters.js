export const MY_LISTING_STATUS_FILTERS = [
  ["ALL", "All"],
  ["ACTIVE", "Active"],
  ["PAUSED", "Paused"],
];

export function normalizeMyListingStatus(value) {
  const status = String(value ?? "ALL").toUpperCase();
  return MY_LISTING_STATUS_FILTERS.some(([key]) => key === status)
    ? status
    : "ALL";
}

export function normalizeMyListingQuery(value) {
  return String(value ?? "").trim().slice(0, 120);
}

export function filterMyListings(listings, { query = "", status = "ALL" } = {}) {
  const normalizedQuery = normalizeMyListingQuery(query).toLowerCase();
  const normalizedStatus = normalizeMyListingStatus(status);

  return listings.filter((listing) => {
    if (normalizedStatus === "ACTIVE" && !listing.active) return false;
    if (normalizedStatus === "PAUSED" && listing.active) return false;

    if (!normalizedQuery) return true;

    return [listing.title, listing.location, listing.placeType]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery));
  });
}

export function myListingsHref({ query = "", status = "ALL" } = {}) {
  const params = new URLSearchParams();
  const normalizedQuery = normalizeMyListingQuery(query);
  const normalizedStatus = normalizeMyListingStatus(status);

  if (normalizedQuery) params.set("q", normalizedQuery);
  if (normalizedStatus !== "ALL") params.set("status", normalizedStatus);

  const value = params.toString();
  return value ? `/my-listings?${value}` : "/my-listings";
}
