export const HOST_RESERVATION_STATUS_FILTERS = [
  ["ALL", "All"],
  ["PENDING", "Pending"],
  ["CONFIRMED", "Confirmed"],
  ["DECLINED", "Declined"],
  ["CANCELLED", "Cancelled"],
];

export function normalizeHostReservationStatus(value) {
  const status = String(value ?? "ALL").toUpperCase();
  return HOST_RESERVATION_STATUS_FILTERS.some(([key]) => key === status)
    ? status
    : "ALL";
}

export function normalizeHostListingFilter(value, ownedListingIds = []) {
  const listingId = String(value ?? "ALL").trim();
  if (!listingId || listingId === "ALL") return "ALL";

  const owned = new Set(ownedListingIds.map((id) => String(id)));
  return owned.has(listingId) ? listingId : "ALL";
}

export function hostedReservationsWhere({ hostId, status, listingId }) {
  const where = {
    listing: {
      ownerId: hostId,
      ...(listingId === "ALL" ? {} : { id: listingId }),
    },
  };

  if (status !== "ALL") where.status = status;
  return where;
}

export function hostReservationsHref({ status = "ALL", listingId = "ALL" } = {}) {
  const params = new URLSearchParams();
  if (status !== "ALL") params.set("status", status);
  if (listingId !== "ALL") params.set("listing", listingId);
  const query = params.toString();
  return query ? `/host/reservations?${query}` : "/host/reservations";
}
