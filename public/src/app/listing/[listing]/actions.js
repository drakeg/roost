"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function respondToReview(formData) {
  const user = await requireUser();
  const reviewId = String(formData.get("reviewId") ?? "");
  const response = String(formData.get("response") ?? "").trim();

  if (!reviewId) {
    throw new Error("Review is required.");
  }

  if (!response || response.length > 1000) {
    throw new Error("Host responses must be between 1 and 1000 characters.");
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      listingId: true,
      listing: { select: { ownerId: true } },
    },
  });

  if (!review) {
    throw new Error("Review not found.");
  }

  if (review.listing.ownerId !== user.id && user.role !== "ADMIN") {
    throw new Error("You are not allowed to respond to this review.");
  }

  await prisma.review.update({
    where: { id: review.id },
    data: {
      hostResponse: response,
      hostRespondedAt: new Date(),
    },
  });

  revalidatePath(`/listing/${review.listingId}`);
}
