"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { parseAmenities } from "@/lib/amenities";
import { parseDateInput } from "@/lib/pricing";

const ALLOWED_SORTS = new Set([
  "recommended",
  "rating",
  "price-asc",
  "price-desc",
]);

function parseOptionalPositiveInt(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function defaultSearchName({ query, placeType, guests, maxPrice }) {
  if (query) return query.slice(0, 80);
  if (placeType) return `${placeType} stays`.slice(0, 80);
  if (guests) return `Stays for ${guests}+ guests`;
  if (maxPrice) return `Stays up to $${maxPrice}/night`;
  return "Saved search";
}

export async function saveSearch(formData) {
  const user = await requireUser();

  const query = String(formData.get("q") ?? "").trim().slice(0, 200);
  const placeType = String(formData.get("type") ?? "").trim().slice(0, 100);
  const guests = parseOptionalPositiveInt(formData.get("guests"));
  const maxPrice = parseOptionalPositiveInt(formData.get("maxPrice"));
  const startsAt = parseDateInput(formData.get("startsAt"));
  const endsAt = parseDateInput(formData.get("endsAt"));
  const amenities = parseAmenities(formData.getAll("amenities"));
  const requestedSort = String(formData.get("sort") ?? "recommended");
  const sort = ALLOWED_SORTS.has(requestedSort) ? requestedSort : "recommended";
  const requestedName = String(formData.get("name") ?? "").trim().slice(0, 80);
  const name =
    requestedName ||
    defaultSearchName({ query, placeType, guests, maxPrice });

  if ((startsAt && !endsAt) || (!startsAt && endsAt) || (startsAt && endsAt && endsAt <= startsAt)) {
    throw new Error("Saved-search dates must include a valid check-in and check-out.");
  }

  const count = await prisma.savedSearch.count({ where: { userId: user.id } });
  if (count >= 20) {
    throw new Error("You can save up to 20 searches. Remove one before saving another.");
  }

  await prisma.savedSearch.create({
    data: {
      userId: user.id,
      name,
      query: query || null,
      placeType: placeType || null,
      guests,
      maxPrice,
      startsAt,
      endsAt,
      amenities,
      sort,
    },
  });

  revalidatePath("/search");
}

export async function deleteSavedSearch(formData) {
  const user = await requireUser();
  const savedSearchId = String(formData.get("savedSearchId") ?? "");

  if (!savedSearchId) return;

  await prisma.savedSearch.deleteMany({
    where: {
      id: savedSearchId,
      userId: user.id,
    },
  });

  revalidatePath("/search");
}
