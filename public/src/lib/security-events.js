export const SECURITY_EVENT_TYPES = {
  LOGIN_LOCKED: "LOGIN_LOCKED",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  PASSWORD_RESET: "PASSWORD_RESET",
  EMAIL_CHANGED: "EMAIL_CHANGED",
  SESSION_REVOKED: "SESSION_REVOKED",
  OTHER_SESSIONS_REVOKED: "OTHER_SESSIONS_REVOKED",
  SESSION_LIMIT_EVICTION: "SESSION_LIMIT_EVICTION",
};

export function securityEventLabel(type) {
  return {
    LOGIN_LOCKED: "Login temporarily locked",
    PASSWORD_CHANGED: "Password changed",
    PASSWORD_RESET: "Password reset",
    EMAIL_CHANGED: "Email address changed",
    SESSION_REVOKED: "Session revoked",
    OTHER_SESSIONS_REVOKED: "Other sessions signed out",
    SESSION_LIMIT_EVICTION: "Old sessions automatically removed",
  }[type] ?? "Account security activity";
}

export function sanitizeSecurityEventDetails(details) {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return {};
  }

  const allowed = new Set([
    "count",
    "reason",
    "verifiedReset",
  ]);
  const safe = {};

  for (const [key, value] of Object.entries(details)) {
    if (!allowed.has(key)) continue;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      safe[key] = typeof value === "string" ? value.slice(0, 100) : value;
    }
  }

  return safe;
}

export function securityEventSummary(event) {
  const details =
    event?.details && typeof event.details === "object" && !Array.isArray(event.details)
      ? event.details
      : {};

  if (event?.type === SECURITY_EVENT_TYPES.SESSION_LIMIT_EVICTION && details.count) {
    return `${details.count} oldest session${details.count === 1 ? "" : "s"} removed.`;
  }

  if (event?.type === SECURITY_EVENT_TYPES.OTHER_SESSIONS_REVOKED && details.count) {
    return `${details.count} other session${details.count === 1 ? "" : "s"} signed out.`;
  }

  return "";
}
