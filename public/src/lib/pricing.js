const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateInput(value) {
  const text = String(value ?? "");

  if (!DATE_INPUT_PATTERN.test(text)) return null;

  const date = new Date(`${text}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function toDateInputValue(date) {
  return new Date(date).toISOString().slice(0, 10);
}

export function todayUtc() {
  const now = new Date();
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  ));
}

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
