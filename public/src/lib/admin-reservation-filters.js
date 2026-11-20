import { parseDateInput } from "@/lib/pricing";

export const RESERVATION_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "DECLINED",
  "CANCELLED",
];

export function normalizeAdminReservationFilters(params = {}) {
  const rawStatus = String(params?.status ?? "ALL").toUpperCase();
  const status = RESERVATION_STATUSES.includes(rawStatus) ? rawStatus : "ALL";
  const from = parseDateInput(params?.from);
  const to = parseDateInput(params?.to);

  let toExclusive = null;
  if (to) {
    toExclusive = new Date(to);
    toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);
  }

  const invalidRange = Boolean(from && to && to < from);

  return {
    status,
    from: invalidRange ? null : from,
    to: invalidRange ? null : to,
    toExclusive: invalidRange ? null : toExclusive,
    invalidRange,
  };
}

export function adminReservationWhere(filters) {
  return {
    ...(filters.status === "ALL" ? {} : { status: filters.status }),
    ...(filters.from || filters.toExclusive
      ? {
          createdAt: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.toExclusive ? { lt: filters.toExclusive } : {}),
          },
        }
      : {}),
  };
}

export function personName(person, fallback = "Unknown") {
  const fullName = [person?.firstName, person?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || (person?.username ? `@${person.username}` : fallback);
}
