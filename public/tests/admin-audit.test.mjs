import test from "node:test";
import assert from "node:assert/strict";
import {
  auditActionLabel,
  auditDetailsSummary,
  auditTargetLabel,
  normalizeAuditFilter,
  sanitizeAuditDetails,
} from "../src/lib/admin-audit.js";

test("sanitizeAuditDetails keeps only bounded primitive metadata", () => {
  const sanitized = sanitizeAuditDetails({
    username: "host1",
    fromRole: "USER",
    toRole: "ADMIN",
    nested: { secret: true },
    invalid_key_with_way_too_many_characters_beyond_the_documented_limit_123456789: "drop",
  });

  assert.deepEqual(sanitized, {
    username: "host1",
    fromRole: "USER",
    toRole: "ADMIN",
  });
});

test("sanitizeAuditDetails truncates long strings", () => {
  const sanitized = sanitizeAuditDetails({ title: "x".repeat(500) });
  assert.equal(sanitized.title.length, 200);
});

test("audit filters fall back safely for unknown values", () => {
  assert.equal(
    normalizeAuditFilter("user_role_changed", ["ALL", "USER_ROLE_CHANGED"]),
    "USER_ROLE_CHANGED"
  );
  assert.equal(
    normalizeAuditFilter("DROP TABLE", ["ALL", "USER_ROLE_CHANGED"]),
    "ALL"
  );
});

test("audit labels and detail summaries remain readable", () => {
  assert.equal(auditActionLabel("USER_ROLE_CHANGED"), "User role changed");
  assert.equal(auditTargetLabel("LISTING"), "Listing");
  assert.equal(
    auditDetailsSummary({ fromRole: "USER", toRole: "ADMIN" }),
    "from Role: USER · to Role: ADMIN"
  );
});
