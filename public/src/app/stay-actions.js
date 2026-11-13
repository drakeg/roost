"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { calculateNights, parseDateInput, todayUtc } from "@/lib/pricing";
import { notifyReservationUser } from "@/lib/reservation-notifications";

export async function toggleWishlist(formData) {
  const user = await requireUser();
  const listingId = String(formData.get("listingId") ?? "");

  if (!listingId) {
    throw new Error("A listing is required.");
  }

  const existing = await prisma.wishlist.findUnique({
    where: {
      userId_listingId: {
        userId: user.id,
        listingId,
      },
    },
  });

  if (existing) {
    await prisma.wishlist.delete({ where: { id: existing.id } });
  } else {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { active: true },
    });

    if (!listing?.active) {
      throw new Error("This listing is not available to save.");
    }

    await prisma.wishlist.create({
      data: {
        userId: user.id,
        listingId,
      },
    });
  }

  revalidatePath(`/listing/${listingId}`);
  revalidatePath("/wishlist");
}

export async function createTrip(formData) {
  const user = await requireUser();
  const listingId = String(formData.get("listingId") ?? "");
  const startsAtRaw = String(formData.get("startsAt") ?? "");
  const endsAtRaw = String(formData.get("endsAt") ?? "");
  const guests = Number.parseInt(String(formData.get("guests") ?? "1"), 10);

  const startsAt = parseDateInput(startsAtRaw);
  const endsAt = parseDateInput(endsAtRaw);

  if (
    !listingId ||
    !startsAt ||
    !endsAt ||
    startsAt < todayUtc() ||
    endsAt <= startsAt
  ) {
    throw new Error("Choose a valid check-in and check-out date.");
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, ownerId: true, price: true, active: true, guests: true },
  });

  if (!listing || !listing.active) {
    throw new Error("Listing not found.");
  }

  if (!Number.isFinite(guests) || guests < 1 || guests > listing.guests) {
    throw new Error(`Choose between 1 and ${listing.guests} guests.`);
  }

  if (listing.ownerId === user.id) {
    throw new Error("You cannot reserve your own listing.");
  }

  const nights = calculateNights(startsAt, endsAt);

  if (nights < 1) {
    throw new Error("Choose a valid check-in and check-out date.");
  }

  const nightlyRate = listing.price;
  const totalPrice = nightlyRate * nights;

  let bookedTripId = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      bookedTripId = await prisma.$transaction(
        async (tx) => {
          const [tripConflict, blocked] = await Promise.all([
            tx.trip.findFirst({
              where: {
                listingId,
                status: { in: ["PENDING", "CONFIRMED"] },
                AND: [
                  { startsAt: { lt: endsAt } },
                  { endsAt: { gt: startsAt } },
                ],
              },
              select: { id: true },
            }),
            tx.listingBlock.findFirst({
              where: {
                listingId,
                AND: [
                  { startsAt: { lt: endsAt } },
                  { endsAt: { gt: startsAt } },
                ],
              },
              select: { id: true },
            }),
          ]);

          if (tripConflict || blocked) {
            return null;
          }

          const trip = await tx.trip.create({
            data: {
              userId: user.id,
              listingId,
              startsAt,
              endsAt,
              nightlyRate,
              nights,
              totalPrice,
              guests,
            },
          });

          await tx.reservationEvent.create({
            data: {
              tripId: trip.id,
              actorId: user.id,
              fromStatus: null,
              toStatus: "PENDING",
            },
          });

          return trip.id;
        },
        {
          isolationLevel: "Serializable",
        }
      );

      break;
    } catch (error) {
      if (error?.code !== "P2034" || attempt === 3) {
        throw error;
      }
    }
  }

  if (!bookedTripId) {
    redirect(`/listing/${listingId}?error=Those%20dates%20are%20not%20available`);
  }

  await notifyReservationUser({
    tripId: bookedTripId,
    userId: listing.ownerId,
    subject: "New Roost reservation request",
    message: "A guest submitted a reservation request for one of your listings.",
  });

  revalidatePath("/trips");
  revalidatePath("/host/reservations");
  redirect("/trips");
}

export async function cancelTrip(formData) {
  const user = await requireUser();
  const tripId = String(formData.get("tripId") ?? "");

  const cancelledTrip = await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findFirst({
      where: {
        id: tripId,
        userId: user.id,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: {
        id: true,
        status: true,
        listing: { select: { ownerId: true } },
      },
    });

    if (!trip) return null;

    await tx.trip.update({
      where: { id: trip.id },
      data: { status: "CANCELLED" },
    });

    await tx.reservationEvent.create({
      data: {
        tripId: trip.id,
        actorId: user.id,
        fromStatus: trip.status,
        toStatus: "CANCELLED",
      },
    });

    return trip;
  });

  if (cancelledTrip?.listing.ownerId) {
    await notifyReservationUser({
      tripId: cancelledTrip.id,
      userId: cancelledTrip.listing.ownerId,
      subject: "A Roost reservation was cancelled",
      message: "The guest cancelled this reservation.",
    });
  }

  revalidatePath("/trips");
  revalidatePath("/host/reservations");
}
