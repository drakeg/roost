import { prisma } from "@/lib/prisma";
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

export async function getAdminReservationReport(filters, { limit = 250 } = {}) {
  const where = adminReservationWhere(filters);

  const [reservations, totalCount, groupedStatuses, confirmedValue, missingConfirmedValue] =
    await Promise.all([
      prisma.trip.findMany({
        where,
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              owner: {
                select: {
                  username: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          user: {
            select: {
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.trip.count({ where }),
      prisma.trip.groupBy({
        by: ["status"],
        where,
        _count: { _all: true },
      }),
      prisma.trip.aggregate({
        where: {
          ...where,
          status: "CONFIRMED",
          totalPrice: { not: null },
        },
        _sum: { totalPrice: true },
      }),
      prisma.trip.count({
        where: {
          ...where,
          status: "CONFIRMED",
          totalPrice: null,
        },
      }),
    ]);

  const statusCounts = Object.fromEntries(
    RESERVATION_STATUSES.map((status) => [status, 0])
  );

  for (const row of groupedStatuses) {
    statusCounts[row.status] = row._count._all;
  }

  return {
    reservations,
    totalCount,
    statusCounts,
    confirmedBookingValue: confirmedValue._sum.totalPrice ?? 0,
    missingConfirmedValue,
  };
}

export function personName(person, fallback = "Unknown") {
  const fullName = [person?.firstName, person?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || (person?.username ? `@${person.username}` : fallback);
}
