import Link from "next/link";
import ListingCard from "@/components/listingCard";
import { getListingsForOwner } from "@/lib/listings";
import { requireUser } from "@/lib/auth";
import { setListingActive } from "./actions";
import {
  MY_LISTING_STATUS_FILTERS,
  filterMyListings,
  myListingsHref,
  normalizeMyListingQuery,
  normalizeMyListingStatus,
} from "@/lib/my-listing-filters";

export const dynamic = "force-dynamic";

export default async function MyListingsPage({ searchParams }) {
  const user = await requireUser();
  const params = await searchParams;
  const query = normalizeMyListingQuery(params?.q);
  const statusFilter = normalizeMyListingStatus(params?.status);
  const allListings = await getListingsForOwner(user.id);
  const listings = filterMyListings(allListings, {
    query,
    status: statusFilter,
  });

  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <p className="text-sm font-semibold text-sky-700">Hosting</p>
      <h1 className="text-4xl font-bold tracking-tight">My listings</h1>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-slate-500">
          Listings owned by @{user.username}.
        </p>
        <Link
          href="/host/calendar"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:border-sky-400 hover:text-sky-700"
        >
          View host calendar
        </Link>
      </div>

      {allListings.length ? (
        <>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Search listings
                </span>
                <input
                  name="q"
                  defaultValue={query}
                  maxLength={120}
                  placeholder="Title, location, or stay type"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </label>
              {statusFilter !== "ALL" ? (
                <input type="hidden" name="status" value={statusFilter} />
              ) : null}
              <button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
                Search
              </button>
            </form>

            <nav
              className="mt-4 flex flex-wrap gap-2"
              aria-label="Filter listings by status"
            >
              {MY_LISTING_STATUS_FILTERS.map(([key, label]) => (
                <Link
                  key={key}
                  href={myListingsHref({ query, status: key })}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    statusFilter === key
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-sky-400 hover:text-sky-700"
                  }`}
                >
                  {label}
                </Link>
              ))}
              {query ? (
                <Link
                  href={myListingsHref({ status: statusFilter })}
                  className="rounded-full px-3 py-2 text-sm font-semibold text-sky-700"
                >
                  Clear search
                </Link>
              ) : null}
            </nav>

            <p className="mt-4 text-sm text-slate-500">
              Showing {listings.length} of {allListings.length} listing
              {allListings.length === 1 ? "" : "s"}.
            </p>
          </div>

          {listings.length ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <div key={listing.id} className="space-y-3">
                  <ListingCard listing={listing} />
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Link
                      href={`/my-listings/${listing.id}/edit`}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold hover:border-sky-400 hover:text-sky-700"
                    >
                      Edit listing
                    </Link>
                    <Link
                      href={`/my-listings/${listing.id}/availability`}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold hover:border-sky-400 hover:text-sky-700"
                    >
                      Availability
                    </Link>
                    <Link
                      href={`/host/reservations?listing=${listing.id}`}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold hover:border-sky-400 hover:text-sky-700"
                    >
                      Reservations
                    </Link>
                    <form action={setListingActive}>
                      <input type="hidden" name="listingId" value={listing.id} />
                      <input
                        type="hidden"
                        name="active"
                        value={String(!listing.active)}
                      />
                      <button className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:border-sky-400 hover:text-sky-700">
                        {listing.active ? "Pause listing" : "Activate listing"}
                      </button>
                    </form>
                  </div>
                  <div className="flex items-center justify-between gap-3 px-1 text-xs">
                    <Link
                      href={`/host/calendar?listing=${listing.id}`}
                      className="font-semibold text-sky-700 hover:text-sky-800"
                    >
                      View in calendar →
                    </Link>
                    {!listing.active ? (
                      <span className="font-semibold text-amber-700">
                        Hidden from public search
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="font-semibold">No listings match these filters.</p>
              <Link
                href="/my-listings"
                className="mt-3 inline-block text-sm font-semibold text-sky-700"
              >
                Clear filters →
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-semibold">You have not created a listing yet.</p>
          <Link
            href="/new-listing"
            className="mt-3 inline-block text-sm font-semibold text-sky-700"
          >
            Create your first listing →
          </Link>
        </div>
      )}
    </section>
  );
}
