import test from "node:test";
import assert from "node:assert/strict";
import {
  redactLogText,
  sanitizeLogValue,
} from "../src/lib/logger.js";

test("redactLogText removes email addresses and sensitive query values", () => {
  const text =
    "Reset user@example.com at https://roost.test/reset-password?token=supersecret&next=/";

  const redacted = redactLogText(text);

  assert.equal(redacted.includes("user@example.com"), false);
  assert.equal(redacted.includes("supersecret"), false);
  assert.match(redacted, /\[REDACTED_EMAIL\]/);
  assert.match(redacted, /token=\[REDACTED\]/);
});

test("sanitizeLogValue redacts nested sensitive keys", () => {
  const sanitized = sanitizeLogValue({
    userId: "user_123",
    password: "p@ssword",
    nested: {
      sessionToken: "abc",
      authorization: "Bearer abc",
    },
  });

  assert.equal(sanitized.userId, "user_123");
  assert.equal(sanitizeLogValue({ photo: "/uploads/photo.jpg" }).photo, "/uploads/photo.jpg");
  assert.equal(sanitized.password, "[REDACTED]");
  assert.equal(sanitized.nested.sessionToken, "[REDACTED]");
  assert.equal(sanitized.nested.authorization, "[REDACTED]");
});

test("sanitizeLogValue keeps safe error metadata but redacts sensitive text", () => {
  const error = new Error(
    "Delivery failed for person@example.com at https://roost.test/verify-email?token=abc"
  );
  error.code = "SMTP_FAILED";

  const sanitized = sanitizeLogValue(error);

  assert.equal(sanitized.name, "Error");
  assert.equal(sanitized.message.includes("person@example.com"), false);
  assert.equal(sanitized.message.includes("token=abc"), false);
  assert.equal(sanitized.code, "SMTP_FAILED");
});
