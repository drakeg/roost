"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { parsePhotoUrls } from "@/lib/listing-photos";
import { parseAmenities } from "@/lib/amenities";
import {
  deleteListingPhoto,
  saveListingPhotoUploads,
  validateListingPhotoUploads,
} from "@/lib/listing-photo-storage";

function readListingForm(formData, existingPhotos) {
  const title = String(formData.get("title") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const placeType = String(formData.get("placeType") ?? "").trim();
  const locationType = String(formData.get("locationType") ?? "Destination").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number.parseInt(String(formData.get("price") ?? ""), 10);
  const guests = Number.parseInt(String(formData.get("guests") ?? "1"), 10);
  const bedrooms = Number.parseInt(String(formData.get("bedrooms") ?? "1"), 10);
  const photos = parsePhotoUrls(formData.get("photos"), {
    allowedInternalUrls: existingPhotos.filter((photo) => String(photo).startsWith("/uploads/")),
  });
  const uploads = validateListingPhotoUploads(formData.getAll("photoFiles"), photos.length);
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
    uploads,
    amenities,
  };
}

export async function updateListing(listingId, formData) {
  const user = await requireUser();

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { ownerId: true, photos: true },
  });

  if (!listing) {
    redirect("/my-listings");
  }

  if (listing.ownerId !== user.id && user.role !== "ADMIN") {
    redirect("/my-listings");
  }

  const existingPhotos = Array.isArray(listing.photos) ? listing.photos : [];
  const form = readListingForm(formData, existingPhotos);
  const { uploads, ...listingData } = form;
  const uploadedPhotos = await saveListingPhotoUploads(listingId, uploads);
  const nextPhotos = [...listingData.photos, ...uploadedPhotos];

  let updated;

  try {
    updated = await prisma.listing.update({
      where: { id: listingId },
      data: {
        ...listingData,
        photos: nextPhotos,
      },
      select: { active: true },
    });
  } catch (error) {
    await Promise.allSettled(uploadedPhotos.map((photo) => deleteListingPhoto(photo)));
    throw error;
  }

  const removedUploads = existingPhotos.filter(
    (photo) =>
      String(photo).startsWith("/uploads/") && !nextPhotos.includes(photo)
  );
  await Promise.allSettled(removedUploads.map((photo) => deleteListingPhoto(photo)));

  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/my-listings");
  revalidatePath(`/listing/${listingId}`);
  redirect(updated.active ? `/listing/${listingId}` : "/my-listings");
}
