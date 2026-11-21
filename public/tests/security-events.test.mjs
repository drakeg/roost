import test from "node:test";
import assert from "node:assert/strict";
import {
  SECURITY_EVENT_TYPES,
  sanitizeSecurityEventDetails,
  securityEventLabel,
  securityEventSummary,
} from "../src/lib/security-events.js";

test("security event labels are readable with a safe fallback", () => {
  assert.equal(
    securityEventLabel(SECURITY_EVENT_TYPES.LOGIN_LOCKED),
    "Login temporarily locked"
  );
  assert.equal(
    securityEventLabel(SECURITY_EVENT_TYPES.PASSWORD_RESET),
    "Password reset"
  );
  assert.equal(securityEventLabel("UNKNOWN_EVENT"), "Account security activity");
});

test("security event detail sanitization keeps only approved primitive metadata", () => {
  const sanitized = sanitizeSecurityEventDetails({
    count: 3,
    reason: "failed_login_limit",
    verifiedReset: true,
    email: "person@example.com",
    token: "secret",
    userAgent: "browser",
    nested: { bad: true },
  });

  assert.deepEqual(sanitized, {
    count: 3,
    reason: "failed_login_limit",
    verifiedReset: true,
  });
});

test("security event string details are bounded", () => {
  const sanitized = sanitizeSecurityEventDetails({
    reason: "x".repeat(500),
  });

  assert.equal(sanitized.reason.length, 100);
});

test("security event summaries expose counts without sensitive identifiers", () => {
  assert.equal(
    securityEventSummary({
      type: SECURITY_EVENT_TYPES.SESSION_LIMIT_EVICTION,
      details: { count: 2 },
    }),
    "2 oldest sessions removed."
  );

  assert.equal(
    securityEventSummary({
      type: SECURITY_EVENT_TYPES.OTHER_SESSIONS_REVOKED,
      details: { count: 1 },
    }),
    "1 other session signed out."
  );

  assert.equal(
    securityEventSummary({
      type: SECURITY_EVENT_TYPES.PASSWORD_CHANGED,
      details: {},
    }),
    ""
  );
});
