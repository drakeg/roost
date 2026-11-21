import test from "node:test";
import assert from "node:assert/strict";
import { scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import {
  DUMMY_LOGIN_PASSWORD_HASH,
  LOGIN_FAILURE_LIMIT,
  clearedLoginThrottleState,
  LOGIN_FAILURE_WINDOW_MS,
  LOGIN_LOCK_MS,
  isLoginLocked,
  nextLoginFailureState,
  successfulLoginState,
} from "../src/lib/login-security.js";

const scrypt = promisify(scryptCallback);

async function verifyAgainstStored(password, stored) {
  const [salt, hash] = stored.split(":");
  const derived = Buffer.from(await scrypt(password, salt, 64));
  const expected = Buffer.from(hash, "hex");
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

test("dummy login hash is a valid scrypt record for constant-cost invalid-user checks", async () => {
  assert.equal(
    await verifyAgainstStored(
      "roost-invalid-login-placeholder",
      DUMMY_LOGIN_PASSWORD_HASH
    ),
    true
  );
  assert.equal(
    await verifyAgainstStored("wrong-password", DUMMY_LOGIN_PASSWORD_HASH),
    false
  );
});

test("login failures accumulate inside the rolling window and lock at the threshold", () => {
  const start = new Date("2026-11-21T18:00:00.000Z");
  let state = {
    failedLoginAttempts: 0,
    loginFailureWindowStartedAt: null,
    loginLockedUntil: null,
  };

  for (let attempt = 1; attempt <= LOGIN_FAILURE_LIMIT; attempt += 1) {
    const now = new Date(start.getTime() + (attempt - 1) * 1000);
    state = nextLoginFailureState(state, now);

    assert.equal(state.failedLoginAttempts, attempt);
    assert.equal(
      Boolean(state.loginLockedUntil),
      attempt === LOGIN_FAILURE_LIMIT
    );
  }

  assert.equal(
    state.loginLockedUntil.getTime(),
    start.getTime() + (LOGIN_FAILURE_LIMIT - 1) * 1000 + LOGIN_LOCK_MS
  );
  assert.equal(state.lockTriggered, true);
});

test("expired failure windows restart the attempt counter", () => {
  const start = new Date("2026-11-21T18:00:00.000Z");
  const later = new Date(start.getTime() + LOGIN_FAILURE_WINDOW_MS + 1);

  const next = nextLoginFailureState(
    {
      failedLoginAttempts: 8,
      loginFailureWindowStartedAt: start,
      loginLockedUntil: null,
    },
    later
  );

  assert.equal(next.failedLoginAttempts, 1);
  assert.equal(next.loginFailureWindowStartedAt, later);
  assert.equal(next.loginLockedUntil, null);
  assert.equal(next.lockTriggered, false);
});

test("login locks expire without extending themselves", () => {
  const now = new Date("2026-11-21T18:00:00.000Z");
  const record = {
    loginLockedUntil: new Date(now.getTime() + LOGIN_LOCK_MS),
  };

  assert.equal(isLoginLocked(record, now), true);
  assert.equal(
    isLoginLocked(record, new Date(now.getTime() + LOGIN_LOCK_MS + 1)),
    false
  );
});

test("password recovery can clear login throttle state without faking a login", () => {
  assert.deepEqual(clearedLoginThrottleState(), {
    failedLoginAttempts: 0,
    loginFailureWindowStartedAt: null,
    loginLockedUntil: null,
  });
});

test("successful login clears throttle state and records last login time", () => {
  const now = new Date("2026-11-21T18:00:00.000Z");
  assert.deepEqual(successfulLoginState(now), {
    failedLoginAttempts: 0,
    loginFailureWindowStartedAt: null,
    loginLockedUntil: null,
    lastLoginAt: now,
  });
});
