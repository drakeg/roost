import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function getReservationThreadForUser(tripId, user) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          location: true,
          ownerId: true,
          owner: {
            select: {
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
      messages: {
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      events: {
        include: {
          actor: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!trip) return null;

  const allowed =
    user.role === "ADMIN" ||
    trip.userId === user.id ||
    trip.listing.ownerId === user.id;

  return allowed ? trip : null;
}

export function displayPerson(person) {
  const fullName = [person?.firstName, person?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || (person?.username ? `@${person.username}` : "Roost user");
}

export async function requireReservationThread(tripId, user) {
  const trip = await getReservationThreadForUser(tripId, user);
  if (!trip) redirect("/trips");
  return trip;
}


export async function markReservationMessagesRead(trip, user) {
  const isParticipant =
    trip.userId === user.id ||
    trip.listing.ownerId === user.id;

  if (!isParticipant) return;

  await prisma.reservationMessage.updateMany({
    where: {
      tripId: trip.id,
      senderId: { not: user.id },
      readAt: null,
    },
    data: { readAt: new Date() },
  });
}
