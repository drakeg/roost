"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { parsePhotoUrls } from "@/lib/listing-photos";
import { parseAmenities } from "@/lib/amenities";

function readListingForm(formData) {
  const title = String(formData.get("title") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const placeType = String(formData.get("placeType") ?? "").trim();
  const locationType = String(formData.get("locationType") ?? "Destination").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number.parseInt(String(formData.get("price") ?? ""), 10);
  const guests = Number.parseInt(String(formData.get("guests") ?? "1"), 10);
  const bedrooms = Number.parseInt(String(formData.get("bedrooms") ?? "1"), 10);
  const photos = parsePhotoUrls(formData.get("photos"));
  const amenities = parseAmenities(formData.getAll("amenities"));

  if (!title || !location || !placeType || !Number.isFinite(price) || price < 1) {
    throw new Error("Title, location, stay type, and a valid nightly price are required.");
  }

  return {
    title,
    location,
    placeType,
    locationType,
    description: description || null,
    price,
    guests: Number.isFinite(guests) ? Math.max(1, guests) : 1,
    bedrooms: Number.isFinite(bedrooms) ? Math.max(1, bedrooms) : 1,
    photos,
    amenities,
  };
}

export async function updateListing(listingId, formData) {
  const user = await requireUser();

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });

  if (!listing) {
    redirect("/my-listings");
  }

  if (listing.ownerId !== user.id && user.role !== "ADMIN") {
    redirect("/my-listings");
  }

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: readListingForm(formData),
    select: { active: true },
  });

  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/my-listings");
  revalidatePath(`/listing/${listingId}`);
  redirect(updated.active ? `/listing/${listingId}` : "/my-listings");
}
