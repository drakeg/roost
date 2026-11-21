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

export function normalizeAuditFilter(value, allowed, fallback = "ALL") {
  const normalized = String(value ?? fallback).toUpperCase();
  return allowed.includes(normalized) ? normalized : fallback;
}

export function auditDetailsSummary(details) {
  if (!details || typeof details !== "object" || Array.isArray(details)) return "";

  const parts = [];
  for (const [key, value] of Object.entries(details)) {
    if (value === null || value === undefined || value === "") continue;
    const label = key.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ");
    parts.push(`${label}: ${String(value)}`);
  }
  return parts.join(" · ");
}
