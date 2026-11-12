"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getReservationThreadForUser } from "@/lib/reservation-messages";

export async function sendReservationMessage(formData) {
  const user = await requireUser();
  const tripId = String(formData.get("tripId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!tripId) {
    redirect("/trips");
  }

  if (!body || body.length > 2000) {
    redirect(
      `/reservations/${tripId}/messages?error=Message%20must%20be%20between%201%20and%202000%20characters`
    );
  }

  const trip = await getReservationThreadForUser(tripId, user);

  if (!trip) {
    redirect("/trips");
  }

  await prisma.reservationMessage.create({
    data: {
      tripId,
      senderId: user.id,
      body,
    },
  });

  revalidatePath(`/reservations/${tripId}/messages`);
  revalidatePath("/trips");
  revalidatePath("/host/reservations");
  redirect(`/reservations/${tripId}/messages`);
}
