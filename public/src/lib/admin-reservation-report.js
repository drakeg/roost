import { prisma } from "@/lib/prisma";
import {
  adminReservationWhere,
  personName,
  RESERVATION_STATUSES,
} from "@/lib/admin-reservation-filters";

export { normalizeAdminReservationFilters, personName, RESERVATION_STATUSES } from "@/lib/admin-reservation-filters";

export async function getAdminReservationReport(filters, { limit = 250 } = {}) {
  const where = adminReservationWhere(filters);

  const includeConfirmedValue =
    filters.status === "ALL" || filters.status === "CONFIRMED";

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
      includeConfirmedValue
        ? prisma.trip.aggregate({
            where: {
              ...where,
              status: "CONFIRMED",
              totalPrice: { not: null },
            },
            _sum: { totalPrice: true },
          })
        : Promise.resolve({ _sum: { totalPrice: null } }),
      includeConfirmedValue
        ? prisma.trip.count({
            where: {
              ...where,
              status: "CONFIRMED",
              totalPrice: null,
            },
          })
        : Promise.resolve(0),
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
