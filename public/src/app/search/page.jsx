import ListingCard from "@/components/listingCard";
import { getListingFilterOptions, getListings } from "@/lib/listings";
import { parseDateInput, toDateInputValue, todayUtc } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const query = params?.q ?? "";
  const placeType = params?.type ?? "";
  const guests = params?.guests ?? "";
  const maxPrice = params?.maxPrice ?? "";
  const startsAt = params?.startsAt ?? "";
  const endsAt = params?.endsAt ?? "";
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

  const [listings, filters] = await Promise.all([
    getListings({ query, placeType, guests, maxPrice, startsAt, endsAt, sort }),
    getListingFilterOptions(),
  ]);

  const activeFilterCount = [
    placeType,
    guests,
    maxPrice,
    validAvailabilityWindow,
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
