import test from "node:test";
import assert from "node:assert/strict";
import {
  ACTIVE_RESERVATION_STATUSES,
  canAccessReservation,
  canGuestCancel,
  canHostTransition,
  guestCancellationWhere,
  hostedReservationTransitionWhere,
  hostTransitionSourceStatuses,
  isReservationParticipant,
  reservationAccessRole,
} from "../src/lib/reservation-lifecycle.js";

test("host lifecycle permits only valid reservation transitions", () => {
  const allowed = [
    ["PENDING", "CONFIRMED"],
    ["PENDING", "DECLINED"],
    ["PENDING", "CANCELLED"],
    ["CONFIRMED", "CANCELLED"],
  ];

  for (const [fromStatus, toStatus] of allowed) {
    assert.equal(canHostTransition(fromStatus, toStatus), true);
  }

  const denied = [
    ["CONFIRMED", "DECLINED"],
    ["CONFIRMED", "CONFIRMED"],
    ["DECLINED", "CANCELLED"],
    ["CANCELLED", "CONFIRMED"],
    ["PENDING", "UNKNOWN"],
  ];

  for (const [fromStatus, toStatus] of denied) {
    assert.equal(canHostTransition(fromStatus, toStatus), false);
  }
});

test("host transition source statuses match decision and cancellation rules", () => {
  assert.deepEqual(hostTransitionSourceStatuses("CONFIRMED"), ["PENDING"]);
  assert.deepEqual(hostTransitionSourceStatuses("DECLINED"), ["PENDING"]);
  assert.deepEqual(
    hostTransitionSourceStatuses("CANCELLED"),
    ["PENDING", "CONFIRMED"]
  );
  assert.deepEqual(hostTransitionSourceStatuses("UNKNOWN"), []);
});

test("host transition query is scoped to the owning host and valid source statuses", () => {
  assert.deepEqual(
    hostedReservationTransitionWhere({
      tripId: "trip_1",
      hostId: "host_1",
      toStatus: "CONFIRMED",
    }),
    {
      id: "trip_1",
      status: { in: ["PENDING"] },
      listing: { ownerId: "host_1" },
    }
  );

  assert.deepEqual(
    hostedReservationTransitionWhere({
      tripId: "trip_1",
      hostId: "host_1",
      toStatus: "CANCELLED",
    }),
    {
      id: "trip_1",
      status: { in: ["PENDING", "CONFIRMED"] },
      listing: { ownerId: "host_1" },
    }
  );

  assert.equal(
    hostedReservationTransitionWhere({
      tripId: "trip_1",
      hostId: "host_1",
      toStatus: "UNKNOWN",
    }),
    null
  );
});

test("guest cancellation query is scoped to the guest and active statuses", () => {
  assert.deepEqual(ACTIVE_RESERVATION_STATUSES, ["PENDING", "CONFIRMED"]);
  assert.equal(canGuestCancel("PENDING"), true);
  assert.equal(canGuestCancel("CONFIRMED"), true);
  assert.equal(canGuestCancel("DECLINED"), false);
  assert.equal(canGuestCancel("CANCELLED"), false);

  assert.deepEqual(
    guestCancellationWhere({ tripId: "trip_1", userId: "guest_1" }),
    {
      id: "trip_1",
      userId: "guest_1",
      status: { in: ["PENDING", "CONFIRMED"] },
    }
  );
  assert.equal(
    guestCancellationWhere({ tripId: "", userId: "guest_1" }),
    null
  );
});

test("reservation access allows admin, guest, or listing host only", () => {
  const base = {
    guestId: "guest_1",
    hostId: "host_1",
  };

  assert.equal(
    reservationAccessRole({
      ...base,
      userId: "admin_1",
      userRole: "ADMIN",
    }),
    "ADMIN"
  );
  assert.equal(
    reservationAccessRole({
      ...base,
      userId: "guest_1",
      userRole: "USER",
    }),
    "GUEST"
  );
  assert.equal(
    reservationAccessRole({
      ...base,
      userId: "host_1",
      userRole: "USER",
    }),
    "HOST"
  );
  assert.equal(
    reservationAccessRole({
      ...base,
      userId: "other_1",
      userRole: "USER",
    }),
    null
  );
  assert.equal(
    canAccessReservation({
      ...base,
      userId: "other_1",
      userRole: "USER",
    }),
    false
  );
});

test("message read-state changes are limited to reservation participants", () => {
  assert.equal(
    isReservationParticipant({
      userId: "guest_1",
      guestId: "guest_1",
      hostId: "host_1",
    }),
    true
  );
  assert.equal(
    isReservationParticipant({
      userId: "host_1",
      guestId: "guest_1",
      hostId: "host_1",
    }),
    true
  );
  assert.equal(
    isReservationParticipant({
      userId: "admin_1",
      guestId: "guest_1",
      hostId: "host_1",
    }),
    false
  );
});
