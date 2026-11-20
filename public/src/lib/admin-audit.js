export const ADMIN_AUDIT_ACTIONS = {
  USER_ROLE_CHANGED: "USER_ROLE_CHANGED",
  LISTING_FEATURED_CHANGED: "LISTING_FEATURED_CHANGED",
};

export function auditActionLabel(action) {
  return {
    USER_ROLE_CHANGED: "User role changed",
    LISTING_FEATURED_CHANGED: "Listing featured status changed",
  }[action] ?? action;
}

export function auditTargetLabel(targetType) {
  return {
    USER: "User",
    LISTING: "Listing",
  }[targetType] ?? targetType;
}

export function sanitizeAuditDetails(details) {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return {};
  }

  const safe = {};
  for (const [key, value] of Object.entries(details)) {
    if (!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(key)) continue;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      safe[key] = typeof value === "string" ? value.slice(0, 200) : value;
    }
  }

  return safe;
}
