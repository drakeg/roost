export const LOGIN_FAILURE_LIMIT = 10;
export const LOGIN_FAILURE_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_LOCK_MS = 15 * 60 * 1000;

export const DUMMY_LOGIN_PASSWORD_HASH =
  "00000000000000000000000000000000:7a8b1f197123f0a18734e6c921d2e49c6badee4d035356aaf00efc92bca3f47d085e1f1c4cd601e8d3a3f2b4c9e9aea055264a969e6593fe83dcd43857b1a044";

function validDate(value) {
  return value instanceof Date && Number.isFinite(value.getTime());
}

export function isLoginLocked(record, now = new Date()) {
  return Boolean(
    validDate(record?.loginLockedUntil) && record.loginLockedUntil > now
  );
}

export function nextLoginFailureState(record, now = new Date()) {
  const windowStartedAt = validDate(record?.loginFailureWindowStartedAt)
    ? record.loginFailureWindowStartedAt
    : null;
  const withinWindow = Boolean(
    windowStartedAt &&
      now.getTime() - windowStartedAt.getTime() < LOGIN_FAILURE_WINDOW_MS
  );
  const failedLoginAttempts = withinWindow
    ? Math.max(0, Number(record?.failedLoginAttempts) || 0) + 1
    : 1;
  const lockTriggered = failedLoginAttempts >= LOGIN_FAILURE_LIMIT;

  return {
    failedLoginAttempts,
    loginFailureWindowStartedAt: withinWindow ? windowStartedAt : now,
    loginLockedUntil: lockTriggered
      ? new Date(now.getTime() + LOGIN_LOCK_MS)
      : null,
    lockTriggered,
  };
}

export function successfulLoginState(now = new Date()) {
  return {
    failedLoginAttempts: 0,
    loginFailureWindowStartedAt: null,
    loginLockedUntil: null,
    lastLoginAt: now,
  };
}
