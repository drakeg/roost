"use client";

import { useMemo, useState } from "react";
import { createTrip } from "@/app/stay-actions";

function parseDate(value) {
  return value ? new Date(`${value}T00:00:00Z`) : null;
}

function nightsBetween(startValue, endValue) {
  const start = parseDate(startValue);
  const end = parseDate(endValue);

  if (!start || !end || end <= start) return 0;

  return Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function BookingForm({
  listingId,
  nightlyRate,
  defaultStart,
  defaultEnd,
}) {
  const [startsAt, setStartsAt] = useState(defaultStart);
  const [endsAt, setEndsAt] = useState(defaultEnd);

  const nights = useMemo(
    () => nightsBetween(startsAt, endsAt),
    [startsAt, endsAt]
  );

  const total = nightlyRate * nights;

  return (
    <form action={createTrip} className="mt-5 space-y-4">
      <input type="hidden" name="listingId" value={listingId} />

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Check in
        </span>
        <input
          type="date"
          name="startsAt"
          min={defaultStart}
          value={startsAt}
          onChange={(event) => setStartsAt(event.target.value)}
          required
          className="w-full rounded-xl border border-slate-300 px-3 py-2"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Check out
        </span>
        <input
          type="date"
          name="endsAt"
          min={startsAt || defaultEnd}
          value={endsAt}
          onChange={(event) => setEndsAt(event.target.value)}
          required
          className="w-full rounded-xl border border-slate-300 px-3 py-2"
        />
      </label>

      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
        {nights > 0 ? (
          <div className="space-y-2">
            <div className="flex justify-between gap-4">
              <span>
                {money(nightlyRate)} × {nights} night{nights === 1 ? "" : "s"}
              </span>
              <span>{money(total)}</span>
            </div>
            <div className="flex justify-between gap-4 border-t border-slate-200 pt-2 font-bold text-slate-950">
              <span>Estimated total</span>
              <span>{money(total)}</span>
            </div>
          </div>
        ) : (
          <p>Choose a check-out date after check-in to see the total.</p>
        )}
      </div>

      <p className="text-xs text-slate-500">
        No payment is collected yet. This amount is saved with the reservation request.
      </p>

      <button
        disabled={nights < 1}
        className="w-full rounded-2xl bg-sky-400 px-5 py-4 font-bold text-slate-950 hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Reserve stay
      </button>
    </form>
  );
}
