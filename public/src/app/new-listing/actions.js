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

export async function createListing(formData) {
  const title = String(formData.get("title") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const placeType = String(formData.get("placeType") ?? "").trim();
  const locationType = String(formData.get("locationType") ?? "Destination").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number.parseInt(String(formData.get("price") ?? ""), 10);
  const guests = Number.parseInt(String(formData.get("guests") ?? "1"), 10);
  const bedrooms = Number.parseInt(String(formData.get("bedrooms") ?? "1"), 10);
  const photos = parsePhotoUrls(formData.get("photos"));
  const uploads = validateListingPhotoUploads(formData.getAll("photoFiles"), photos.length);
  const amenities = parseAmenities(formData.getAll("amenities"));

  if (!title || !location || !placeType || !Number.isFinite(price) || price < 1) {
    throw new Error("Title, location, stay type, and a valid nightly price are required.");
  }

  const owner = await requireUser();

  const listing = await prisma.listing.create({
    data: {
      title,
      description: description || null,
      location,
      locationType,
      placeType,
      price,
      guests: Number.isFinite(guests) ? Math.max(1, guests) : 1,
      bedrooms: Number.isFinite(bedrooms) ? Math.max(1, bedrooms) : 1,
      rating: 0,
      featured: false,
      photos,
      amenities,
      ownerId: owner.id,
    },
  });

  let uploadedPhotos = [];

  try {
    uploadedPhotos = await saveListingPhotoUploads(listing.id, uploads);

    if (uploadedPhotos.length) {
      await prisma.listing.update({
        where: { id: listing.id },
        data: { photos: [...photos, ...uploadedPhotos] },
      });
    }
  } catch (error) {
    await Promise.allSettled(uploadedPhotos.map((photo) => deleteListingPhoto(photo)));
    await prisma.listing.delete({ where: { id: listing.id } });
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/my-listings");
  redirect(`/listing/${listing.id}`);
}
