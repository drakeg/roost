import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateNights,
  parseDateInput,
  toDateInputValue,
} from "../src/lib/pricing.js";

test("parseDateInput accepts valid ISO dates and rejects malformed input", () => {
  assert.equal(parseDateInput("2026-11-19").toISOString(), "2026-11-19T00:00:00.000Z");
  assert.equal(parseDateInput("11/19/2026"), null);
  assert.equal(parseDateInput(""), null);
});

test("calculateNights uses whole UTC stay days", () => {
  assert.equal(
    calculateNights(
      new Date("2026-11-19T00:00:00.000Z"),
      new Date("2026-11-22T00:00:00.000Z")
    ),
    3
  );
  assert.equal(
    calculateNights(
      new Date("2026-11-22T00:00:00.000Z"),
      new Date("2026-11-19T00:00:00.000Z")
    ),
    0
  );
});

test("toDateInputValue is UTC-stable", () => {
  assert.equal(
    toDateInputValue(new Date("2026-11-19T23:59:59.000Z")),
    "2026-11-19"
  );
});
