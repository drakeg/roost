"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { todayUtc } from "@/lib/pricing";

export async function submitReview(formData) {
  const user = await requireUser();
  const tripId = String(formData.get("tripId") ?? "");
  const rating = Number.parseInt(String(formData.get("rating") ?? ""), 10);
  const comment = String(formData.get("comment") ?? "").trim();

  if (!tripId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Choose a rating from 1 to 5.");
  }

  if (comment.length > 1000) {
    throw new Error("Review comments must be 1000 characters or fewer.");
  }

  let listingId;

  await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findFirst({
      where: {
        id: tripId,
        userId: user.id,
        status: "CONFIRMED",
        endsAt: { lt: todayUtc() },
      },
      select: {
        listingId: true,
        review: { select: { id: true } },
      },
    });

    if (!trip) {
      throw new Error("Only completed confirmed stays can be reviewed.");
    }

    if (trip.review) {
      throw new Error("This stay has already been reviewed.");
    }

    listingId = trip.listingId;

    await tx.review.create({
      data: {
        tripId,
        userId: user.id,
        listingId,
        rating,
        comment: comment || null,
      },
    });

    const aggregate = await tx.review.aggregate({
      where: { listingId },
      _avg: { rating: true },
    });

    await tx.listing.update({
      where: { id: listingId },
      data: { rating: aggregate._avg.rating ?? 0 },
    });
  });

  revalidatePath("/trips");
  if (listingId) {
    revalidatePath("/");
    revalidatePath("/search");
    revalidatePath(`/listing/${listingId}`);
  }
}
