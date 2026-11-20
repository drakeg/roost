const SENSITIVE_KEY = /(token|password|secret|authorization|cookie|session|smtp|email|recipient|to)$/i;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi;
const TOKEN_QUERY_PATTERN = /([?&](?:token|code|secret|key)=)[^&#\s]+/gi;

export function redactLogText(value) {
  return String(value ?? "")
    .replace(EMAIL_PATTERN, "[REDACTED_EMAIL]")
    .replace(BEARER_PATTERN, "Bearer [REDACTED]")
    .replace(TOKEN_QUERY_PATTERN, "$1[REDACTED]");
}

export function sanitizeLogValue(value, key = "", depth = 0) {
  if (SENSITIVE_KEY.test(key)) return "[REDACTED]";
  if (depth > 5) return "[MAX_DEPTH]";

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactLogText(value.message),
      ...(value.code ? { code: redactLogText(value.code) } : {}),
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogValue(item, "", depth + 1));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        sanitizeLogValue(childValue, childKey, depth + 1),
      ])
    );
  }

  if (typeof value === "string") return redactLogText(value);
  return value;
}

function write(level, event, details = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...sanitizeLogValue(details),
  };

  const serialized = JSON.stringify(payload);

  if (level === "error") {
    console.error(serialized);
  } else if (level === "warn") {
    console.warn(serialized);
  } else {
    console.info(serialized);
  }
}

export const logger = {
  info(event, details) {
    write("info", event, details);
  },
  warn(event, details) {
    write("warn", event, details);
  },
  error(event, details) {
    write("error", event, details);
  },
};
