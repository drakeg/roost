"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { notifyReservationUser } from "@/lib/reservation-notifications";

async function updateHostedReservation(tripId, status) {
  const host = await requireUser();

  if (!tripId) return;

  const updatedTrip = await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findFirst({
      where: {
        id: tripId,
        status: "PENDING",
        listing: {
          ownerId: host.id,
        },
      },
      select: { id: true, status: true, userId: true },
    });

    if (!trip) return null;

    await tx.trip.update({
      where: { id: trip.id },
      data: { status },
    });

    await tx.reservationEvent.create({
      data: {
        tripId: trip.id,
        actorId: host.id,
        fromStatus: trip.status,
        toStatus: status,
      },
    });

    return trip;
  });

  if (updatedTrip) {
    const confirmed = status === "CONFIRMED";
    await notifyReservationUser({
      tripId: updatedTrip.id,
      userId: updatedTrip.userId,
      subject: confirmed
        ? "Your Roost reservation was confirmed"
        : "Your Roost reservation was declined",
      message: confirmed
        ? "Your host confirmed your reservation request."
        : "Your host declined your reservation request.",
    });
  }

  revalidatePath("/host/reservations");
  revalidatePath("/trips");
}

export async function confirmReservation(formData) {
  await updateHostedReservation(
    String(formData.get("tripId") ?? ""),
    "CONFIRMED"
  );
}

export async function declineReservation(formData) {
  await updateHostedReservation(
    String(formData.get("tripId") ?? ""),
    "DECLINED"
  );
}

export async function cancelHostedReservation(formData) {
  const host = await requireUser();
  const tripId = String(formData.get("tripId") ?? "");

  if (!tripId) return;

  const cancelledTrip = await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findFirst({
      where: {
        id: tripId,
        status: { in: ["PENDING", "CONFIRMED"] },
        listing: {
          ownerId: host.id,
        },
      },
      select: { id: true, status: true, userId: true },
    });

    if (!trip) return null;

    await tx.trip.update({
      where: { id: trip.id },
      data: { status: "CANCELLED" },
    });

    await tx.reservationEvent.create({
      data: {
        tripId: trip.id,
        actorId: host.id,
        fromStatus: trip.status,
        toStatus: "CANCELLED",
      },
    });

    return trip;
  });

  if (cancelledTrip) {
    await notifyReservationUser({
      tripId: cancelledTrip.id,
      userId: cancelledTrip.userId,
      subject: "Your Roost reservation was cancelled",
      message: "Your host cancelled this reservation.",
    });
  }

  revalidatePath("/host/reservations");
  revalidatePath("/trips");
}
