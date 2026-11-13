"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

async function updateHostedReservation(tripId, status) {
  const host = await requireUser();

  if (!tripId) return;

  await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findFirst({
      where: {
        id: tripId,
        status: "PENDING",
        listing: {
          ownerId: host.id,
        },
      },
      select: { id: true, status: true },
    });

    if (!trip) return;

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
  });

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

  await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findFirst({
      where: {
        id: tripId,
        status: { in: ["PENDING", "CONFIRMED"] },
        listing: {
          ownerId: host.id,
        },
      },
      select: { id: true, status: true },
    });

    if (!trip) return;

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
  });

  revalidatePath("/host/reservations");
  revalidatePath("/trips");
}
