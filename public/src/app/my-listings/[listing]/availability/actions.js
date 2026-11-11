"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { parseDateInput, todayUtc } from "@/lib/pricing";

export async function createListingBlock(formData) {
  const user = await requireUser();
  const listingId = String(formData.get("listingId") ?? "");
  const startsAt = parseDateInput(formData.get("startsAt"));
  const endsAt = parseDateInput(formData.get("endsAt"));
  const note = String(formData.get("note") ?? "").trim();

  if (
    !listingId ||
    !startsAt ||
    !endsAt ||
    startsAt < todayUtc() ||
    endsAt <= startsAt
  ) {
    redirect(`/my-listings/${listingId}/availability?error=Choose%20a%20valid%20future%20date%20range`);
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, ownerId: true },
  });

  if (!listing || (listing.ownerId !== user.id && user.role !== "ADMIN")) {
    redirect("/my-listings");
  }

  let result = "conflict";

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      result = await prisma.$transaction(
        async (tx) => {
          const [tripConflict, blockConflict] = await Promise.all([
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

          if (tripConflict) return "trip";
          if (blockConflict) return "block";

          await tx.listingBlock.create({
            data: {
              listingId,
              startsAt,
              endsAt,
              note: note ? note.slice(0, 200) : null,
            },
          });

          return "created";
        },
        { isolationLevel: "Serializable" }
      );

      break;
    } catch (error) {
      if (error?.code !== "P2034" || attempt === 3) {
        throw error;
      }
    }
  }

  if (result === "trip") {
    redirect(`/my-listings/${listingId}/availability?error=Those%20dates%20overlap%20an%20active%20reservation`);
  }

  if (result === "block") {
    redirect(`/my-listings/${listingId}/availability?error=Those%20dates%20overlap%20an%20existing%20blocked%20range`);
  }

  if (result !== "created") {
    redirect(`/my-listings/${listingId}/availability?error=Those%20dates%20could%20not%20be%20blocked`);
  }

  revalidatePath("/search");
  revalidatePath(`/listing/${listingId}`);
  revalidatePath(`/my-listings/${listingId}/availability`);
  redirect(`/my-listings/${listingId}/availability?saved=1`);
}

export async function deleteListingBlock(formData) {
  const user = await requireUser();
  const blockId = String(formData.get("blockId") ?? "");

  const block = await prisma.listingBlock.findUnique({
    where: { id: blockId },
    select: {
      id: true,
      listingId: true,
      listing: { select: { ownerId: true } },
    },
  });

  if (!block || (block.listing.ownerId !== user.id && user.role !== "ADMIN")) {
    redirect("/my-listings");
  }

  await prisma.listingBlock.delete({ where: { id: block.id } });

  revalidatePath("/search");
  revalidatePath(`/listing/${block.listingId}`);
  revalidatePath(`/my-listings/${block.listingId}/availability`);
  redirect(`/my-listings/${block.listingId}/availability?removed=1`);
}
