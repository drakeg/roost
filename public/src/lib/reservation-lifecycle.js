export const ACTIVE_RESERVATION_STATUSES = Object.freeze([
  "PENDING",
  "CONFIRMED",
]);

export const HOST_DECISION_TARGET_STATUSES = Object.freeze([
  "CONFIRMED",
  "DECLINED",
]);

export function hostTransitionSourceStatuses(toStatus) {
  if (HOST_DECISION_TARGET_STATUSES.includes(toStatus)) {
    return ["PENDING"];
  }

  if (toStatus === "CANCELLED") {
    return [...ACTIVE_RESERVATION_STATUSES];
  }

  return [];
}

export function canHostTransition(fromStatus, toStatus) {
  return hostTransitionSourceStatuses(toStatus).includes(fromStatus);
}

export function canGuestCancel(status) {
  return ACTIVE_RESERVATION_STATUSES.includes(status);
}

export function hostedReservationTransitionWhere({
  tripId,
  hostId,
  toStatus,
}) {
  if (!tripId || !hostId) return null;

  const allowedStatuses = hostTransitionSourceStatuses(toStatus);
  if (!allowedStatuses.length) return null;

  return {
    id: tripId,
    status: { in: allowedStatuses },
    listing: {
      ownerId: hostId,
    },
  };
}

export function guestCancellationWhere({ tripId, userId }) {
  if (!tripId || !userId) return null;

  return {
    id: tripId,
    userId,
    status: { in: [...ACTIVE_RESERVATION_STATUSES] },
  };
}

export function reservationAccessRole({
  userId,
  userRole,
  guestId,
  hostId,
}) {
  if (!userId) return null;
  if (userRole === "ADMIN") return "ADMIN";
  if (guestId && userId === guestId) return "GUEST";
  if (hostId && userId === hostId) return "HOST";
  return null;
}

export function canAccessReservation(context) {
  return Boolean(reservationAccessRole(context));
}

export function isReservationParticipant({ userId, guestId, hostId }) {
  if (!userId) return false;
  return userId === guestId || userId === hostId;
}
