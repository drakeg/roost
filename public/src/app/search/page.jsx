import ListingCard from "@/components/listingCard";
import { getListingFilterOptions, getListings } from "@/lib/listings";
import { parseDateInput, toDateInputValue, todayUtc } from "@/lib/pricing";
import { AMENITIES, parseAmenities } from "@/lib/amenities";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveSearch, deleteSavedSearch } from "./actions";

export const dynamic = "force-dynamic";

function savedSearchHref(saved) {
  const params = new URLSearchParams();

  if (saved.query) params.set("q", saved.query);
  if (saved.placeType) params.set("type", saved.placeType);
  if (saved.guests) params.set("guests", String(saved.guests));
  if (saved.maxPrice) params.set("maxPrice", String(saved.maxPrice));
  if (saved.startsAt) params.set("startsAt", saved.startsAt.toISOString().slice(0, 10));
  if (saved.endsAt) params.set("endsAt", saved.endsAt.toISOString().slice(0, 10));
  for (const amenity of saved.amenities ?? []) params.append("amenities", amenity);
  if (saved.sort && saved.sort !== "recommended") params.set("sort", saved.sort);

  const value = params.toString();
  return value ? `/search?${value}` : "/search";
}

function savedSearchSummary(saved) {
  const parts = [];
  if (saved.placeType) parts.push(saved.placeType);
  if (saved.guests) parts.push(`${saved.guests}+ guests`);
  if (saved.maxPrice) parts.push(`≤ ${saved.maxPrice}/night`);
  if (saved.amenities?.length) parts.push(`${saved.amenities.length} amenity filter${saved.amenities.length === 1 ? "" : "s"}`);
  if (saved.startsAt && saved.endsAt) {
    parts.push(
      `${saved.startsAt.toISOString().slice(0, 10)} → ${saved.endsAt.toISOString().slice(0, 10)}`
    );
  }
  return parts.length ? parts.join(" · ") : "All stays";
}

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const query = params?.q ?? "";
  const placeType = params?.type ?? "";
  const guests = params?.guests ?? "";
  const maxPrice = params?.maxPrice ?? "";
  const startsAt = params?.startsAt ?? "";
  const endsAt = params?.endsAt ?? "";
  const selectedAmenities = parseAmenities(
    Array.isArray(params?.amenities)
      ? params.amenities
      : params?.amenities
        ? [params.amenities]
        : []
  );
  const sort = params?.sort ?? "recommended";

  const parsedStart = parseDateInput(startsAt);
  const parsedEnd = parseDateInput(endsAt);
  const validAvailabilityWindow = Boolean(
    parsedStart &&
    parsedEnd &&
    parsedStart >= todayUtc() &&
    parsedEnd > parsedStart
  );
  const hasPartialOrInvalidDates = Boolean(
    (startsAt || endsAt) && !validAvailabilityWindow
  );
  const minimumDate = toDateInputValue(todayUtc());

  const [listings, filters, savedSearches] = await Promise.all([
    getListings({
      query,
      placeType,
      guests,
      maxPrice,
      startsAt,
      endsAt,
      amenities: selectedAmenities,
      sort,
    }),
    getListingFilterOptions(),
    user
      ? prisma.savedSearch.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      : Promise.resolve([]),
  ]);

  const activeFilterCount = [
    placeType,
    guests,
    maxPrice,
    validAvailabilityWindow,
    selectedAmenities.length ? true : false,
  ].filter(Boolean).length;

  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold text-sky-700">Explore</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              {query ? `Results for “${query}”` : "All stays"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {listings.length} stay{listings.length === 1 ? "" : "s"} found
              {activeFilterCount ? ` · ${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"}` : ""}
            </p>
          </div>
        </div>

        {user ? (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-sky-700">Saved searches</p>
                <h2 className="mt-1 text-xl font-bold">Reuse your favorite filters</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Save up to 20 searches. Alerts are not enabled in this first slice.
                </p>
              </div>

              <form action={saveSearch} className="flex w-full max-w-xl flex-col gap-2 sm:flex-row">
                <input
                  name="name"
                  maxLength={80}
                  placeholder="Name this search (optional)"
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm"
                />
                <input type="hidden" name="q" value={query} />
                <input type="hidden" name="type" value={placeType} />
                <input type="hidden" name="guests" value={guests} />
                <input type="hidden" name="maxPrice" value={maxPrice} />
                <input type="hidden" name="startsAt" value={validAvailabilityWindow ? startsAt : ""} />
                <input type="hidden" name="endsAt" value={validAvailabilityWindow ? endsAt : ""} />
                <input type="hidden" name="sort" value={sort} />
                {selectedAmenities.map((amenity) => (
                  <input key={amenity} type="hidden" name="amenities" value={amenity} />
                ))}
                <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                  Save current search
                </button>
              </form>
            </div>

            {savedSearches.length ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {savedSearches.map((saved) => (
                  <article
                    key={saved.id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="min-w-0">
                      <a
                        href={savedSearchHref(saved)}
                        className="font-semibold text-slate-950 hover:text-sky-700"
                      >
                        {saved.name}
                      </a>
                      <p className="mt-1 truncate text-sm text-slate-500">
                        {saved.query ? `“${saved.query}” · ` : ""}
                        {savedSearchSummary(saved)}
                      </p>
                    </div>
                    <form action={deleteSavedSearch}>
                      <input type="hidden" name="savedSearchId" value={saved.id} />
                      <button
                        aria-label={`Delete saved search ${saved.name}`}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-red-300 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </form>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                No saved searches yet. Set your filters, then save them here.
              </p>
            )}
          </section>
        ) : null}

        {hasPartialOrInvalidDates ? (
          <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
            Choose both check-in and check-out, with check-out after check-in. Availability was not applied.
          </p>
        ) : null}

        <form className="mt-6 grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-8">
          <label className="xl:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Where or what
            </span>
            <input
              name="q"
              defaultValue={query}
              placeholder="Cabin, Pittsburgh, waterfront…"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
            />
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Stay type
            </span>
            <select
              name="type"
              defaultValue={placeType}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
            >
              <option value="">Any type</option>
              {filters.placeTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Check in
            </span>
            <input
              type="date"
              name="startsAt"
              defaultValue={startsAt}
              min={minimumDate}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Check out
            </span>
            <input
              type="date"
              name="endsAt"
              defaultValue={endsAt}
              min={startsAt || minimumDate}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Guests
            </span>
            <select
              name="guests"
              defaultValue={guests}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
            >
              <option value="">Any</option>
              {[2, 4, 6, 8].map((count) => (
                <option key={count} value={count}>{count}+</option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Max / night
            </span>
            <select
              name="maxPrice"
              defaultValue={maxPrice}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
            >
              <option value="">Any price</option>
              {[125, 150, 200, 250].map((price) => (
                <option key={price} value={price}>Up to ${price}</option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button className="w-full rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800">
              Apply
            </button>
          </div>

          <fieldset className="md:col-span-2 xl:col-span-6">
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Amenities
            </legend>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((amenity) => (
                <label
                  key={amenity.value}
                  className="flex items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    name="amenities"
                    value={amenity.value}
                    defaultChecked={selectedAmenities.includes(amenity.value)}
                  />
                  <span>{amenity.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="md:col-span-2 xl:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Sort
            </span>
            <select
              name="sort"
              defaultValue={sort}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
            >
              <option value="recommended">Recommended</option>
              <option value="rating">Top rated</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </label>

          {(query || activeFilterCount || sort !== "recommended") && (
            <div className="flex items-end">
              <a
                href="/search"
                className="w-full rounded-xl border border-slate-300 px-5 py-3 text-center font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear
              </a>
            </div>
          )}
        </form>
      </div>

      {listings.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              searchParams={{
                startsAt: validAvailabilityWindow ? startsAt : "",
                endsAt: validAvailabilityWindow ? endsAt : "",
                guests,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h2 className="text-xl font-semibold">No stays matched those filters.</h2>
          <p className="mt-2 text-slate-500">
            Try a broader destination, higher nightly price, or fewer guests.
          </p>
          <a
            href="/search"
            className="mt-5 inline-block rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white"
          >
            Clear filters
          </a>
        </div>
      )}
    </section>
  );
}
