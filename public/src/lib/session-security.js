export const MAX_ACTIVE_SESSIONS = 10;

function timestamp(value) {
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.getTime() : 0;
}

export function excessSessionIdsForNewSession(
  sessions,
  maxActiveSessions = MAX_ACTIVE_SESSIONS
) {
  const keepExisting = Math.max(0, maxActiveSessions - 1);

  return [...sessions]
    .sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt))
    .slice(keepExisting)
    .map((session) => session.id);
}
