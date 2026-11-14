import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelTrip } from "@/app/stay-actions";
import { calculateNights, formatCurrency, todayUtc } from "@/lib/pricing";
import { submitReview } from "./actions";

export const dynamic = "force-dynamic";

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function statusLabel(status) {
  return {
    PENDING: "Pending host approval",
    CONFIRMED: "Confirmed",
    DECLINED: "Declined",
    CANCELLED: "Cancelled",
  }[status] ?? status;
}

const STATUS_FILTERS = [
  ["ALL", "All"],
  ["PENDING", "Pending"],
  ["CONFIRMED", "Confirmed"],
  ["DECLINED", "Declined"],
  ["CANCELLED", "Cancelled"],
];

function normalizeStatusFilter(value) {
  const status = String(value ?? "ALL").toUpperCase();
  return STATUS_FILTERS.some(([key]) => key === status) ? status : "ALL";
}

export default async function TripsPage({ searchParams }) {
  const user = await requireUser();
  const params = await searchParams;
  const statusFilter = normalizeStatusFilter(params?.status);

  const trips = await prisma.trip.findMany({
    where: {
      userId: user.id,
      ...(statusFilter === "ALL" ? {} : { status: statusFilter }),
    },
    include: {
      listing: true,
      review: true,
      _count: {
        select: {
          messages: {
            where: {
              readAt: null,
              senderId: { not: user.id },
            },
          },
        },
      },
    },
    orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
  });

  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <p className="text-sm font-semibold text-sky-700">Travel</p>
      <h1 className="text-4xl font-bold tracking-tight">My trips</h1>
      <p className="mt-2 text-slate-500">Reservation requests and booking history.</p>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Filter trips by status">
        {STATUS_FILTERS.map(([key, label]) => (
          <Link
            key={key}
            href={key === "ALL" ? "/trips" : `/trips?status=${key}`}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              statusFilter === key
                ? "border-slate-950 bg-slate-950 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-sky-400 hover:text-sky-700"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-8 space-y-4">
        {trips.length ? trips.map((trip) => (
          <article key={trip.id} className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Link href={`/listing/${trip.listing.id}`} className="text-xl font-bold hover:text-sky-700">
                  {trip.listing.title}
                </Link>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {statusLabel(trip.status)}
                </span>
              </div>
              <p className="mt-1 text-slate-500">{trip.listing.location}</p>
              <p className="mt-3 text-sm font-medium text-slate-700">
                {trip.startsAt ? formatDate(trip.startsAt) : "Date TBD"} → {trip.endsAt ? formatDate(trip.endsAt) : "Date TBD"}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {trip.guests ?? 1} guest{(trip.guests ?? 1) === 1 ? "" : "s"}
                {" · "}
                {trip.nights ?? calculateNights(trip.startsAt, trip.endsAt)} night
                {(trip.nights ?? calculateNights(trip.startsAt, trip.endsAt)) === 1 ? "" : "s"}
                {" · "}
                {formatCurrency(
                  trip.totalPrice ??
                    ((trip.nights ?? calculateNights(trip.startsAt, trip.endsAt)) *
                      (trip.nightlyRate ?? trip.listing.price))
                )}
              </p>
            </div>

            <div className="w-full space-y-3 sm:w-auto sm:min-w-64">
              <Link
                href={`/reservations/${trip.id}/messages`}
                className="block w-full rounded-xl border border-slate-300 px-4 py-2 text-center text-sm font-semibold hover:border-sky-400 hover:text-sky-700"
              >
                Messages{trip._count.messages ? ` · ${trip._count.messages} unread` : ""}
              </Link>
              {["PENDING", "CONFIRMED"].includes(trip.status) &&
              (!trip.endsAt || trip.endsAt >= todayUtc()) ? (
                <form action={cancelTrip}>
                  <input type="hidden" name="tripId" value={trip.id} />
                  <button className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:border-red-300 hover:text-red-700">
                    Cancel trip
                  </button>
                </form>
              ) : null}

              {trip.status === "CONFIRMED" &&
              trip.endsAt &&
              trip.endsAt < todayUtc() &&
              !trip.review ? (
                <form action={submitReview} className="space-y-2 rounded-2xl bg-slate-50 p-4">
                  <input type="hidden" name="tripId" value={trip.id} />
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Rate your stay
                  </label>
                  <select
                    name="rating"
                    defaultValue="5"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="5">5 — Excellent</option>
                    <option value="4">4 — Very good</option>
                    <option value="3">3 — Good</option>
                    <option value="2">2 — Fair</option>
                    <option value="1">1 — Poor</option>
                  </select>
                  <textarea
                    name="comment"
                    maxLength={1000}
                    rows={3}
                    placeholder="Share what future guests should know."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                  <button className="w-full rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                    Submit review
                  </button>
                </form>
              ) : null}

              {trip.review ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold">Your review: {"★".repeat(trip.review.rating)}</p>
                  {trip.review.comment ? (
                    <p className="mt-1 text-slate-600">{trip.review.comment}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </article>
        )) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="font-semibold">
              {statusFilter === "ALL"
                ? "No trips booked yet."
                : `No ${statusLabel(statusFilter).toLowerCase()} trips.`}
            </p>
            {statusFilter === "ALL" ? (
              <Link href="/search" className="mt-2 inline-block text-sm font-semibold text-sky-700">Explore stays →</Link>
            ) : (
              <Link href="/trips" className="mt-2 inline-block text-sm font-semibold text-sky-700">View all trips →</Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
