import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { todayUtc } from "@/lib/pricing";
import {
  hostCalendarHref,
  normalizeHostListingFilter,
} from "@/lib/host-calendar-filters";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function monthStartFromParam(value) {
  const match = String(value ?? "").match(/^(\d{4})-(\d{2})$/);

  if (match) {
    const year = Number.parseInt(match[1], 10);
    const month = Number.parseInt(match[2], 10) - 1;

    if (month >= 0 && month <= 11 && year >= 2000 && year <= 2100) {
      return new Date(Date.UTC(year, month, 1));
    }
  }

  const today = todayUtc();
  return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
}

function addMonths(value, amount) {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + amount, 1)
  );
}

function monthParam(value) {
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}`;
}

function formatMonth(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function formatDay(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function dayKey(value) {
  return value.toISOString().slice(0, 10);
}

function eachCalendarDay(monthStart) {
  const gridStart = new Date(monthStart);
  gridStart.setUTCDate(gridStart.getUTCDate() - gridStart.getUTCDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setUTCDate(gridStart.getUTCDate() + index);
    return day;
  });
}

function overlapsDay(startsAt, endsAt, day) {
  if (!startsAt || !endsAt) return false;

  const nextDay = new Date(day);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  return startsAt < nextDay && endsAt > day;
}

function guestName(user) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  return fullName || (user?.username ? `@${user.username}` : "Guest");
}

export default async function HostCalendarPage({ searchParams }) {
  const host = await requireUser();
  const query = await searchParams;
  const monthStart = monthStartFromParam(query?.month);
  const nextMonthStart = addMonths(monthStart, 1);
  const calendarDays = eachCalendarDay(monthStart);
  const rangeStart = calendarDays[0];
  const rangeEnd = new Date(calendarDays[calendarDays.length - 1]);
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 1);

  const allListings = await prisma.listing.findMany({
    where: { ownerId: host.id },
    select: {
      id: true,
      title: true,
      active: true,
      trips: {
        where: {
          status: { in: ["PENDING", "CONFIRMED"] },
          startsAt: { lt: rangeEnd },
          endsAt: { gt: rangeStart },
        },
        select: {
          id: true,
          status: true,
          startsAt: true,
          endsAt: true,
          user: {
            select: {
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { startsAt: "asc" },
      },
      blocks: {
        where: {
          startsAt: { lt: rangeEnd },
          endsAt: { gt: rangeStart },
        },
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
          note: true,
        },
        orderBy: { startsAt: "asc" },
      },
    },
    orderBy: { title: "asc" },
  });

  const listingFilter = normalizeHostListingFilter(
    query?.listing,
    allListings.map((listing) => listing.id)
  );
  const listings =
    listingFilter === "ALL"
      ? allListings
      : allListings.filter((listing) => listing.id === listingFilter);
  const selectedListing =
    listingFilter === "ALL"
      ? null
      : allListings.find((listing) => listing.id === listingFilter) ?? null;

  const entriesByDay = new Map();

  for (const day of calendarDays) {
    const entries = [];

    for (const listing of listings) {
      for (const trip of listing.trips) {
        if (overlapsDay(trip.startsAt, trip.endsAt, day)) {
          entries.push({
            key: `trip-${trip.id}-${dayKey(day)}`,
            type: "reservation",
            listing,
            trip,
          });
        }
      }

      for (const block of listing.blocks) {
        if (overlapsDay(block.startsAt, block.endsAt, day)) {
          entries.push({
            key: `block-${block.id}-${dayKey(day)}`,
            type: "block",
            listing,
            block,
          });
        }
      }
    }

    entriesByDay.set(dayKey(day), entries);
  }

  const monthReservationCount = listings.reduce(
    (total, listing) =>
      total +
      listing.trips.filter(
        (trip) =>
          trip.startsAt < nextMonthStart &&
          trip.endsAt > monthStart
      ).length,
    0
  );
  const monthBlockCount = listings.reduce(
    (total, listing) =>
      total +
      listing.blocks.filter(
        (block) =>
          block.startsAt < nextMonthStart &&
          block.endsAt > monthStart
      ).length,
    0
  );

  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-sky-700">Hosting</p>
          <h1 className="text-4xl font-bold tracking-tight">Calendar</h1>
          <p className="mt-2 text-slate-500">
            Pending and confirmed reservations alongside blocked availability
            {selectedListing ? ` for ${selectedListing.title}` : " across your listings"}.
          </p>
        </div>
        <Link
          href="/my-listings"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:border-sky-400 hover:text-sky-700"
        >
          Manage listings
        </Link>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4">
        <form className="mb-4 grid gap-3 border-b border-slate-200 pb-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Property
            </span>
            <select
              name="listing"
              defaultValue={listingFilter}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
            >
              <option value="ALL">All listings</option>
              {allListings.map((listing) => (
                <option key={listing.id} value={listing.id}>
                  {listing.title}{listing.active ? "" : " (paused)"}
                </option>
              ))}
            </select>
          </label>
          <input type="hidden" name="month" value={monthParam(monthStart)} />
          <button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
            Apply property
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href={hostCalendarHref({
              month: monthParam(addMonths(monthStart, -1)),
              listingId: listingFilter,
            })}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:border-sky-400 hover:text-sky-700"
          >
            ← Previous
          </Link>
          <div className="text-center">
            <h2 className="text-2xl font-bold">{formatMonth(monthStart)}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {monthReservationCount} active reservation
              {monthReservationCount === 1 ? "" : "s"} · {monthBlockCount} blocked range
              {monthBlockCount === 1 ? "" : "s"}
            </p>
          </div>
          <Link
            href={hostCalendarHref({
              month: monthParam(addMonths(monthStart, 1)),
              listingId: listingFilter,
            })}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:border-sky-400 hover:text-sky-700"
          >
            Next →
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
        <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-700">
          Confirmed reservation
        </span>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
          Pending reservation
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
          Blocked
        </span>
      </div>

      {allListings.length ? (
        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {WEEKDAYS.map((weekday) => (
              <div
                key={weekday}
                className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {weekday}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((day) => {
              const inMonth = day.getUTCMonth() === monthStart.getUTCMonth();
              const entries = entriesByDay.get(dayKey(day)) ?? [];

              return (
                <div
                  key={dayKey(day)}
                  className={`min-h-36 border-b border-r border-slate-200 p-2 ${
                    inMonth ? "bg-white" : "bg-slate-50/70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        inMonth ? "text-slate-900" : "text-slate-400"
                      }`}
                    >
                      {day.getUTCDate()}
                    </span>
                    {entries.length ? (
                      <span className="text-[11px] text-slate-400">
                        {entries.length}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 space-y-1.5">
                    {entries.slice(0, 4).map((entry) => {
                      if (entry.type === "reservation") {
                        const confirmed = entry.trip.status === "CONFIRMED";

                        return (
                          <Link
                            key={entry.key}
                            href={`/reservations/${entry.trip.id}/messages`}
                            title={`${entry.listing.title}: ${guestName(entry.trip.user)} · ${formatDay(entry.trip.startsAt)} → ${formatDay(entry.trip.endsAt)}`}
                            className={`block rounded-lg px-2 py-1 text-[11px] font-semibold leading-4 ${
                              confirmed
                                ? "bg-sky-50 text-sky-800 hover:bg-sky-100"
                                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                            }`}
                          >
                            <span className="block truncate">{entry.listing.title}</span>
                            <span className="block truncate opacity-75">
                              {confirmed ? "Confirmed" : "Pending"} · {guestName(entry.trip.user)}
                            </span>
                          </Link>
                        );
                      }

                      return (
                        <Link
                          key={entry.key}
                          href={`/my-listings/${entry.listing.id}/availability`}
                          title={`${entry.listing.title}: blocked ${formatDay(entry.block.startsAt)} → ${formatDay(entry.block.endsAt)}${entry.block.note ? ` · ${entry.block.note}` : ""}`}
                          className="block rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold leading-4 text-slate-700 hover:bg-slate-200"
                        >
                          <span className="block truncate">{entry.listing.title}</span>
                          <span className="block truncate opacity-75">
                            Blocked{entry.block.note ? ` · ${entry.block.note}` : ""}
                          </span>
                        </Link>
                      );
                    })}

                    {entries.length > 4 ? (
                      <p className="px-1 text-[11px] font-semibold text-slate-400">
                        +{entries.length - 4} more
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-semibold">Create a listing to use the host calendar.</p>
          <Link
            href="/new-listing"
            className="mt-3 inline-block text-sm font-semibold text-sky-700"
          >
            Create your first listing →
          </Link>
        </div>
      )}
    </section>
  );
}
