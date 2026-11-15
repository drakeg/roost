import Link from "next/link";
import { requireUser } from "@/lib/auth";
import {
  displayPerson,
  markReservationMessagesRead,
  requireReservationThread,
} from "@/lib/reservation-messages";
import { sendReservationMessage } from "./actions";
import { cancelTrip } from "@/app/stay-actions";
import {
  cancelHostedReservation,
  confirmReservation,
  declineReservation,
} from "@/app/host/reservations/actions";
import { calculateNights, formatCurrency, todayUtc } from "@/lib/pricing";

export const dynamic = "force-dynamic";

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
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

function eventLabel(event) {
  if (!event.fromStatus && event.toStatus === "PENDING") {
    return "Reservation requested";
  }

  return {
    CONFIRMED: "Reservation confirmed",
    DECLINED: "Reservation declined",
    CANCELLED: "Reservation cancelled",
    PENDING: "Reservation moved to pending",
  }[event.toStatus] ?? `Reservation changed to ${event.toStatus.toLowerCase()}`;
}

export default async function ReservationMessagesPage({ params, searchParams }) {
  const user = await requireUser();
  const { trip: tripId } = await params;
  const query = await searchParams;
  const trip = await requireReservationThread(tripId, user);
  await markReservationMessagesRead(trip, user);

  const isGuest = trip.userId === user.id;
  const isHost = trip.listing.ownerId === user.id;
  const otherParty = isGuest ? trip.listing.owner : trip.user;
  const backHref = isGuest ? "/trips" : "/host/reservations";
  const backLabel = isGuest ? "Back to my trips" : "Back to reservations";
  const nights =
    trip.nights ?? calculateNights(trip.startsAt, trip.endsAt);
  const totalPrice =
    trip.totalPrice ??
    (nights * (trip.nightlyRate ?? trip.listing.price));
  const canGuestCancel =
    isGuest &&
    ["PENDING", "CONFIRMED"].includes(trip.status) &&
    (!trip.endsAt || trip.endsAt >= todayUtc());
  const canHostDecide = isHost && trip.status === "PENDING";
  const canHostCancel =
    isHost && ["PENDING", "CONFIRMED"].includes(trip.status);

  return (
    <section className="mx-auto max-w-4xl px-6 py-10">
      <Link href={backHref} className="text-sm font-semibold text-sky-700">
        ← {backLabel}
      </Link>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-sky-700">Reservation details</p>
            <h1 className="mt-1 text-3xl font-bold">{trip.listing.title}</h1>
            <p className="mt-2 text-sm text-slate-500">{trip.listing.location}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {statusLabel(trip.status)}
          </span>
        </div>

        <div className="mt-6 grid gap-4 rounded-2xl bg-slate-50 p-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dates</p>
            <p className="mt-1 font-semibold text-slate-900">
              {trip.startsAt ? formatDate(trip.startsAt) : "Date TBD"} →{" "}
              {trip.endsAt ? formatDate(trip.endsAt) : "Date TBD"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Party</p>
            <p className="mt-1 font-semibold text-slate-900">
              {trip.guests ?? 1} guest{(trip.guests ?? 1) === 1 ? "" : "s"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reservation</p>
            <p className="mt-1 font-semibold text-slate-900">
              {nights} night{nights === 1 ? "" : "s"} · {formatCurrency(totalPrice)}
            </p>
            {trip.nightlyRate ? (
              <p className="mt-1 text-sm text-slate-500">
                {formatCurrency(trip.nightlyRate)} per night
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {isGuest ? "Host" : "Guest"}
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {displayPerson(otherParty)}
            </p>
          </div>
        </div>

        {isGuest || isHost ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {canHostDecide ? (
              <>
                <form action={confirmReservation}>
                  <input type="hidden" name="tripId" value={trip.id} />
                  <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                    Confirm reservation
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
            {canGuestCancel ? (
              <form action={cancelTrip}>
                <input type="hidden" name="tripId" value={trip.id} />
                <button className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
                  Cancel trip
                </button>
              </form>
            ) : null}
            {canHostCancel ? (
              <form action={cancelHostedReservation}>
                <input type="hidden" name="tripId" value={trip.id} />
                <button className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
                  Cancel reservation
                </button>
              </form>
            ) : null}
          </div>
        ) : null}
      </div>

      {query?.error ? (
        <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {query.error}
        </p>
      ) : null}

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold">Reservation history</h2>
        <div className="mt-4 space-y-3">
          {trip.events.length ? (
            trip.events.map((event) => (
              <div
                key={event.id}
                className="flex flex-col gap-1 border-l-2 border-slate-200 pl-4"
              >
                <p className="font-semibold">{eventLabel(event)}</p>
                <p className="text-sm text-slate-500">
                  {event.actor ? displayPerson(event.actor) : "System"} ·{" "}
                  {formatDateTime(event.createdAt)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">
              No detailed history is available for this older reservation.
            </p>
          )}
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Messages</h2>
            <p className="text-sm text-slate-500">
              Conversation with {displayPerson(otherParty)}
            </p>
          </div>
        </div>
        <div className="space-y-3">
        {trip.messages.length ? (
          trip.messages.map((message) => {
            const mine = message.senderId === user.id;

            return (
              <article
                key={message.id}
                className={`max-w-2xl rounded-2xl p-4 ${
                  mine
                    ? "ml-auto bg-slate-950 text-white"
                    : "mr-auto border border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                    {mine ? "You" : displayPerson(message.sender)}
                  </p>
                  <p className="text-xs opacity-60">
                    {formatDateTime(message.createdAt)}
                    {mine && message.readAt ? " · Read" : ""}
                  </p>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words leading-6">
                  {message.body}
                </p>
              </article>
            );
          })
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="font-semibold">No messages yet.</p>
            <p className="mt-2 text-sm text-slate-500">
              Use this thread for questions and reservation details.
            </p>
          </div>
        )}
        </div>
      </section>

      <form
        action={sendReservationMessage}
        className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <input type="hidden" name="tripId" value={trip.id} />
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Message</span>
          <textarea
            name="body"
            rows={4}
            maxLength={2000}
            required
            placeholder={`Message ${displayPerson(otherParty)} about this reservation`}
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">Up to 2,000 characters.</p>
          <button className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white">
            Send message
          </button>
        </div>
      </form>
    </section>
  );
}
