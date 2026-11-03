const DAY_MS = 24 * 60 * 60 * 1000;

export function calculateNights(startsAt, endsAt) {
  const start = startsAt instanceof Date ? startsAt : new Date(startsAt);
  const end = endsAt instanceof Date ? endsAt : new Date(endsAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return 0;
  }

  return Math.round((end.getTime() - start.getTime()) / DAY_MS);
}

export function formatCurrency(value) {
  if (!Number.isFinite(value)) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
