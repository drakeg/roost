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

  const listing = await prisma.listing.findFirst({
    where: {
      id: listingId,
      OR: [{ ownerId: user.id }, ...(user.role === "ADMIN" ? [{ id: listingId }] : [])],
    },
    select: { id: true },
  });

  if (!listing) {
    redirect("/my-listings");
  }

  const [tripConflict, blockConflict] = await Promise.all([
    prisma.trip.findFirst({
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
    prisma.listingBlock.findFirst({
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

  if (tripConflict) {
    redirect(`/my-listings/${listingId}/availability?error=Those%20dates%20overlap%20an%20active%20reservation`);
  }

  if (blockConflict) {
    redirect(`/my-listings/${listingId}/availability?error=Those%20dates%20overlap%20an%20existing%20blocked%20range`);
  }

  await prisma.listingBlock.create({
    data: {
      listingId,
      startsAt,
      endsAt,
      note: note ? note.slice(0, 200) : null,
    },
  });

  revalidatePath("/search");
  revalidatePath(`/listing/${listingId}`);
  revalidatePath(`/my-listings/${listingId}/availability`);
  redirect(`/my-listings/${listingId}/availability?saved=1`);
}

export async function deleteListingBlock(formData) {
  const user = await requireUser();
  const blockId = String(formData.get("blockId") ?? "");

  const block = await prisma.listingBlock.findFirst({
    where: {
      id: blockId,
      listing: {
        OR: [{ ownerId: user.id }, ...(user.role === "ADMIN" ? [{ id: { not: "" } }] : [])],
      },
    },
    select: { id: true, listingId: true },
  });

  if (!block) {
    redirect("/my-listings");
  }

  await prisma.listingBlock.delete({ where: { id: block.id } });

  revalidatePath("/search");
  revalidatePath(`/listing/${block.listingId}`);
  revalidatePath(`/my-listings/${block.listingId}/availability`);
  redirect(`/my-listings/${block.listingId}/availability?removed=1`);
}
