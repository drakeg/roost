import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  cancelHostedReservation,
  confirmReservation,
  declineReservation,
} from "./actions";
import { calculateNights, formatCurrency } from "@/lib/pricing";

export const dynamic = "force-dynamic";

function formatDate(value) {
  if (!value) return "Date TBD";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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

export default async function HostReservationsPage({ searchParams }) {
  const host = await requireUser();
  const params = await searchParams;
  const statusFilter = normalizeStatusFilter(params?.status);

  const trips = await prisma.trip.findMany({
    where: {
      listing: {
        ownerId: host.id,
      },
      ...(statusFilter === "ALL" ? {} : { status: statusFilter }),
    },
    include: {
      listing: true,
      user: {
        select: {
          username: true,
          firstName: true,
          lastName: true,
        },
      },
      _count: {
        select: {
          messages: {
            where: {
              readAt: null,
              senderId: { not: host.id },
            },
          },
        },
      },
    },
    orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
  });

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-sm font-semibold text-sky-700">Hosting</p>
      <h1 className="text-4xl font-bold tracking-tight">Reservations</h1>
      <p className="mt-2 text-slate-500">
        Review requests and reservation history for your listings.
      </p>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Filter hosted reservations by status">
        {STATUS_FILTERS.map(([key, label]) => (
          <Link
            key={key}
            href={key === "ALL" ? "/host/reservations" : `/host/reservations?status=${key}`}
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
        {trips.length ? (
          trips.map((trip) => {
            const guestName =
              [trip.user.firstName, trip.user.lastName].filter(Boolean).join(" ") ||
              `@${trip.user.username}`;

            return (
              <article
                key={trip.id}
                className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[1fr_auto]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/listing/${trip.listing.id}`}
                      className="text-xl font-bold hover:text-sky-700"
                    >
                      {trip.listing.title}
                    </Link>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {statusLabel(trip.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-500">{trip.listing.location}</p>
                  <div className="mt-4 grid gap-1 text-sm text-slate-700">
                    <p><span className="font-semibold">Guest:</span> {guestName}</p>
                    <p>
                      <span className="font-semibold">Dates:</span>{" "}
                      {formatDate(trip.startsAt)} → {formatDate(trip.endsAt)}
                    </p>
                    <p>
                      <span className="font-semibold">Guests:</span>{" "}
                      {trip.guests ?? 1}
                    </p>
                    <p>
                      <span className="font-semibold">Reservation:</span>{" "}
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
                </div>

                <div className="flex flex-wrap items-center gap-2 self-center">
                  <Link
                    href={`/reservations/${trip.id}/messages`}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:border-sky-400 hover:text-sky-700"
                  >
                    Messages{trip._count.messages ? ` · ${trip._count.messages} unread` : ""}
                  </Link>
                  {trip.status === "PENDING" ? (
                    <>
                      <form action={confirmReservation}>
                        <input type="hidden" name="tripId" value={trip.id} />
                        <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                          Confirm
                        </button>
                      </form>
                      <form action={declineReservation}>
                        <input type="hidden" name="tripId" value={trip.id} />
                        <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold">
                          Decline
                        </button>
                      </form>
                    </>
                  ) : null}

                  {["PENDING", "CONFIRMED"].includes(trip.status) ? (
                    <form action={cancelHostedReservation}>
                      <input type="hidden" name="tripId" value={trip.id} />
                      <button className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
                        Cancel reservation
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="font-semibold">
              {statusFilter === "ALL"
                ? "No reservations yet."
                : `No ${statusLabel(statusFilter).toLowerCase()} reservations.`}
            </p>
            {statusFilter === "ALL" ? (
              <p className="mt-2 text-sm text-slate-500">
                Reservation requests will appear here when guests book your listings.
              </p>
            ) : (
              <Link href="/host/reservations" className="mt-2 inline-block text-sm font-semibold text-sky-700">
                View all reservations →
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
