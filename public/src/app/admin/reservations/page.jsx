import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import {
  getAdminReservationReport,
  normalizeAdminReservationFilters,
  personName,
  RESERVATION_STATUSES,
} from "@/lib/admin-reservation-report";
import { formatCurrency } from "@/lib/pricing";

export const dynamic = "force-dynamic";

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function statusLabel(status) {
  return {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    DECLINED: "Declined",
    CANCELLED: "Cancelled",
  }[status] ?? status;
}

function exportHref(params) {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "ALL") query.set("status", params.status);
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);
  const value = query.toString();
  return value ? `/admin/reservations/export?${value}` : "/admin/reservations/export";
}

export default async function AdminReservationsPage({ searchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const filters = normalizeAdminReservationFilters(params);
  const report = await getAdminReservationReport(filters);

  const cancellationRate = report.totalCount
    ? Math.round((report.statusCounts.CANCELLED / report.totalCount) * 100)
    : 0;

  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <Link href="/admin" className="text-sm font-semibold text-sky-700">
        ← Back to admin
      </Link>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-sky-700">Administration</p>
          <h1 className="text-4xl font-bold tracking-tight">Reservation reporting</h1>
          <p className="mt-2 text-slate-500">
            Operational reservation volume, lifecycle mix, cancellations, and snapshotted booking value.
          </p>
        </div>
        <a
          href={exportHref({
            status: filters.status,
            from: params?.from,
            to: params?.to,
          })}
          className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
        >
          Export CSV
        </a>
      </div>

      {filters.invalidRange ? (
        <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          The end date was earlier than the start date, so the date filter was ignored.
        </p>
      ) : null}

      <form className="mt-6 grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
          </span>
          <select
            name="status"
            defaultValue={filters.status}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
          >
            <option value="ALL">All statuses</option>
            {RESERVATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Created from
          </span>
          <input
            type="date"
            name="from"
            defaultValue={params?.from ?? ""}
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Created through
          </span>
          <input
            type="date"
            name="to"
            defaultValue={params?.to ?? ""}
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>

        <div className="flex items-end gap-2">
          <button className="flex-1 rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white">
            Apply
          </button>
          <Link
            href="/admin/reservations"
            className="rounded-xl border border-slate-300 px-4 py-3 font-semibold"
          >
            Clear
          </Link>
        </div>
      </form>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Reservations", report.totalCount],
          ["Pending", report.statusCounts.PENDING],
          ["Confirmed", report.statusCounts.CONFIRMED],
          ["Cancelled", `${report.statusCounts.CANCELLED} (${cancellationRate}%)`],
          ["Confirmed booking value", formatCurrency(report.confirmedBookingValue)],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </article>
        ))}
      </div>

      {report.missingConfirmedValue ? (
        <p className="mt-4 text-sm text-amber-700">
          {report.missingConfirmedValue} confirmed reservation
          {report.missingConfirmedValue === 1 ? "" : "s"} lack a stored total-price snapshot and are excluded from booking value.
        </p>
      ) : null}

      <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {["Created", "Listing", "Host", "Guest", "Stay", "Status", "Guests", "Value"].map((label) => (
                  <th key={label} className="px-4 py-3 font-semibold">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {report.reservations.map((trip) => (
                <tr key={trip.id}>
                  <td className="whitespace-nowrap px-4 py-3">{formatDate(trip.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/listing/${trip.listing.id}`} className="font-semibold hover:text-sky-700">
                      {trip.listing.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{personName(trip.listing.owner, "Unassigned")}</td>
                  <td className="px-4 py-3">{personName(trip.user)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {formatDate(trip.startsAt)} → {formatDate(trip.endsAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/reservations/${trip.id}/messages`}
                      className="font-semibold hover:text-sky-700"
                    >
                      {statusLabel(trip.status)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{trip.guests ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3">{formatCurrency(trip.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!report.reservations.length ? (
          <p className="p-8 text-center text-sm text-slate-500">
            No reservations match the selected filters.
          </p>
        ) : null}

        {report.totalCount > report.reservations.length ? (
          <p className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            Showing the newest {report.reservations.length} of {report.totalCount} matching reservations. CSV export includes up to 5,000 rows.
          </p>
        ) : null}
      </section>
    </section>
  );
}
