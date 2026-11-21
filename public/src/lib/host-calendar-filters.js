import { normalizeHostListingFilter } from "./host-reservation-filters.js";

export { normalizeHostListingFilter };

export function hostCalendarHref({ month, listingId = "ALL" } = {}) {
  const params = new URLSearchParams();

  if (month) params.set("month", String(month));
  if (listingId !== "ALL") params.set("listing", String(listingId));

  const query = params.toString();
  return query ? `/host/calendar?${query}` : "/host/calendar";
}
