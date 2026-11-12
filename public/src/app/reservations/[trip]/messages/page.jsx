import Link from "next/link";
import { requireUser } from "@/lib/auth";
import {
  displayPerson,
  markReservationMessagesRead,
  requireReservationThread,
} from "@/lib/reservation-messages";
import { sendReservationMessage } from "./actions";

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
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export default async function ReservationMessagesPage({ params, searchParams }) {
  const user = await requireUser();
  const { trip: tripId } = await params;
  const query = await searchParams;
  const trip = await requireReservationThread(tripId, user);
  await markReservationMessagesRead(trip, user);

  const isGuest = trip.userId === user.id;
  const otherParty = isGuest ? trip.listing.owner : trip.user;
  const backHref = isGuest ? "/trips" : "/host/reservations";
  const backLabel = isGuest ? "Back to my trips" : "Back to reservations";

  return (
    <section className="mx-auto max-w-4xl px-6 py-10">
      <Link href={backHref} className="text-sm font-semibold text-sky-700">
        ← {backLabel}
      </Link>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-sky-700">Reservation messages</p>
        <h1 className="mt-1 text-3xl font-bold">{trip.listing.title}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {trip.listing.location} · {trip.startsAt ? formatDate(trip.startsAt) : "Date TBD"} →{" "}
          {trip.endsAt ? formatDate(trip.endsAt) : "Date TBD"}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Conversation with {displayPerson(otherParty)}
        </p>
      </div>

      {query?.error ? (
        <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {query.error}
        </p>
      ) : null}

      <div className="mt-6 space-y-3">
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
