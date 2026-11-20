import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getAdminReservationReport,
  normalizeAdminReservationFilters,
  personName,
} from "@/lib/admin-reservation-report";

export const dynamic = "force-dynamic";

function csvCell(value) {
  const text = String(value ?? "");
  const spreadsheetSafe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${spreadsheetSafe.replaceAll('"', '""')}"`;
}

function isoDate(value) {
  return value ? value.toISOString() : "";
}

export async function GET(request) {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const filters = normalizeAdminReservationFilters(
    Object.fromEntries(request.nextUrl.searchParams.entries())
  );
  const report = await getAdminReservationReport(filters, { limit: 5000 });

  const header = [
    "reservation_id",
    "created_at",
    "status",
    "listing",
    "host",
    "guest",
    "stay_start",
    "stay_end",
    "guests",
    "nightly_rate",
    "nights",
    "total_price",
  ];

  const rows = report.reservations.map((trip) => [
    trip.id,
    isoDate(trip.createdAt),
    trip.status,
    trip.listing.title,
    personName(trip.listing.owner, "Unassigned"),
    personName(trip.user),
    isoDate(trip.startsAt),
    isoDate(trip.endsAt),
    trip.guests ?? "",
    trip.nightlyRate ?? "",
    trip.nights ?? "",
    trip.totalPrice ?? "",
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="roost-reservations.csv"',
      "Cache-Control": "no-store",
    },
  });
}
