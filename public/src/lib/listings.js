import { prisma } from "@/lib/prisma";
import { parseDateInput } from "@/lib/pricing";
import { parseAmenities } from "@/lib/amenities";

function toListingCard(listing) {
  return {
    id: listing.id,
    title: listing.title,
    description: listing.description ?? "",
    location: listing.location,
    locationType: listing.locationType,
    placeType: listing.placeType,
    price: listing.price,
    guests: listing.guests,
    bedrooms: listing.bedrooms,
    rating: listing.rating,
    owner:
      listing.owner?.username ??
      [listing.owner?.firstName, listing.owner?.lastName].filter(Boolean).join(" ") ??
      "Roost host",
    featured: listing.featured,
    active: listing.active,
    photos: Array.isArray(listing.photos) ? listing.photos : [],
    amenities: listing.amenities ?? [],
  };
}

export async function getListings({
  query = "",
  placeType = "",
  guests = "",
  maxPrice = "",
  startsAt = "",
  endsAt = "",
  amenities = [],
  sort = "recommended",
} = {}) {
  const minimumGuests = Number.parseInt(guests, 10);
  const maximumPrice = Number.parseInt(maxPrice, 10);
  const requestedAmenities = parseAmenities(amenities);
  const startDate = parseDateInput(startsAt);
  const endDate = parseDateInput(endsAt);
  const hasAvailabilityWindow = Boolean(
    startDate &&
    endDate &&
    endDate > startDate
  );

  const listings = await prisma.listing.findMany({
    where: {
      active: true,
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { location: { contains: query, mode: "insensitive" } },
              { locationType: { contains: query, mode: "insensitive" } },
              { placeType: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(placeType ? { placeType } : {}),
      ...(Number.isFinite(minimumGuests) ? { guests: { gte: minimumGuests } } : {}),
      ...(Number.isFinite(maximumPrice) ? { price: { lte: maximumPrice } } : {}),
      ...(requestedAmenities.length ? { amenities: { hasEvery: requestedAmenities } } : {}),
      ...(hasAvailabilityWindow
        ? {
            AND: [
              {
                trips: {
                  none: {
                    status: { in: ["PENDING", "CONFIRMED"] },
                    AND: [
                      { startsAt: { lt: endDate } },
                      { endsAt: { gt: startDate } },
                    ],
                  },
                },
              },
              {
                blocks: {
                  none: {
                    AND: [
                      { startsAt: { lt: endDate } },
                      { endsAt: { gt: startDate } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: { owner: true },
  });

  const results = listings.map(toListingCard);

  switch (sort) {
    case "price-asc":
      results.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      results.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      results.sort((a, b) => b.rating - a.rating);
      break;
    default:
      results.sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) ||
          b.rating - a.rating
      );
  }

  return results;
}

export async function getFeaturedListings() {
  const listings = await prisma.listing.findMany({
    where: { featured: true, active: true },
    include: { owner: true },
    take: 6,
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
  });

  return listings.map(toListingCard);
}

export async function getListingById(id) {
  const listing = await prisma.listing.findUnique({
    where: { id, active: true },
    include: { owner: true },
  });

  return listing ? toListingCard(listing) : null;
}

export async function getListingsForOwner(ownerId) {
  const listings = await prisma.listing.findMany({
    where: { ownerId },
    include: { owner: true },
    orderBy: { createdAt: "desc" },
  });

  return listings.map(toListingCard);
}

export async function getListingFilterOptions() {
  const rows = await prisma.listing.findMany({
    where: { active: true },
    distinct: ["placeType"],
    select: { placeType: true },
    orderBy: { placeType: "asc" },
  });

  return {
    placeTypes: rows.map((row) => row.placeType),
  };
}
