import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_ACTIVE_SESSIONS,
  excessSessionIdsForNewSession,
} from "../src/lib/session-security.js";

function sessions(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `session-${index + 1}`,
    createdAt: new Date(Date.UTC(2026, 10, 1, 0, index, 0)),
  }));
}

test("new session creation keeps the active session total bounded", () => {
  const existing = sessions(MAX_ACTIVE_SESSIONS);
  const revoked = excessSessionIdsForNewSession(existing);

  assert.deepEqual(revoked, ["session-1"]);
  assert.equal(existing.length - revoked.length + 1, MAX_ACTIVE_SESSIONS);
});

test("session retention evicts oldest sessions first", () => {
  const existing = sessions(13);
  assert.deepEqual(excessSessionIdsForNewSession(existing), [
    "session-4",
    "session-3",
    "session-2",
    "session-1",
  ]);
});

test("accounts below the active session cap keep all existing sessions", () => {
  assert.deepEqual(excessSessionIdsForNewSession(sessions(4)), []);
});
