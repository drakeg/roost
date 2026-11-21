"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  SAVED_SEARCH_LIMIT,
  canSaveAnotherSearch,
  normalizeSavedSearchInput,
  savedSearchDeleteWhere,
} from "@/lib/saved-search";

export async function saveSearch(formData) {
  const user = await requireUser();

  const search = normalizeSavedSearchInput({
    name: formData.get("name"),
    query: formData.get("q"),
    placeType: formData.get("type"),
    guests: formData.get("guests"),
    maxPrice: formData.get("maxPrice"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    amenities: formData.getAll("amenities"),
    sort: formData.get("sort"),
  });

  const count = await prisma.savedSearch.count({ where: { userId: user.id } });
  if (!canSaveAnotherSearch(count)) {
    throw new Error(
      `You can save up to ${SAVED_SEARCH_LIMIT} searches. Remove one before saving another.`
    );
  }

  await prisma.savedSearch.create({
    data: {
      userId: user.id,
      ...search,
    },
  });

  revalidatePath("/search");
}

export async function deleteSavedSearch(formData) {
  const user = await requireUser();
  const where = savedSearchDeleteWhere({
    savedSearchId: String(formData.get("savedSearchId") ?? ""),
    userId: user.id,
  });

  if (!where) return;

  await prisma.savedSearch.deleteMany({ where });

  revalidatePath("/search");
}
