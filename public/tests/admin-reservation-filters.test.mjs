import test from "node:test";
import assert from "node:assert/strict";
import {
  adminReservationWhere,
  normalizeAdminReservationFilters,
  personName,
} from "../src/lib/admin-reservation-filters.js";

test("invalid reservation status falls back to ALL", () => {
  const filters = normalizeAdminReservationFilters({ status: "unknown" });
  assert.equal(filters.status, "ALL");
});

test("report date range is inclusive through the selected end date", () => {
  const filters = normalizeAdminReservationFilters({
    status: "confirmed",
    from: "2026-11-01",
    to: "2026-11-19",
  });

  assert.equal(filters.status, "CONFIRMED");
  assert.equal(filters.from.toISOString(), "2026-11-01T00:00:00.000Z");
  assert.equal(filters.toExclusive.toISOString(), "2026-11-20T00:00:00.000Z");

  const where = adminReservationWhere(filters);
  assert.equal(where.status, "CONFIRMED");
  assert.equal(where.createdAt.gte.toISOString(), "2026-11-01T00:00:00.000Z");
  assert.equal(where.createdAt.lt.toISOString(), "2026-11-20T00:00:00.000Z");
});

test("reversed date range is rejected instead of silently swapping dates", () => {
  const filters = normalizeAdminReservationFilters({
    from: "2026-11-20",
    to: "2026-11-19",
  });

  assert.equal(filters.invalidRange, true);
  assert.equal(filters.from, null);
  assert.equal(filters.to, null);
  assert.equal(filters.toExclusive, null);
  assert.deepEqual(adminReservationWhere(filters), {});
});

test("personName prefers full name, then username, then fallback", () => {
  assert.equal(personName({ firstName: "Ada", lastName: "Lovelace", username: "ada" }), "Ada Lovelace");
  assert.equal(personName({ username: "host1" }), "@host1");
  assert.equal(personName(null, "Unassigned"), "Unassigned");
});
