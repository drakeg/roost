import Link from "next/link";
import ListingCard from "@/components/listingCard";
import { getListingsForOwner } from "@/lib/listings";
import { requireUser } from "@/lib/auth";
import { setListingActive } from "./actions";

export const dynamic = "force-dynamic";

export default async function MyListingsPage() {
  const user = await requireUser();
  const listings = await getListingsForOwner(user.id);

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
                  <input type="hidden" name="active" value={String(!listing.active)} />
                  <button className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:border-sky-400 hover:text-sky-700">
                    {listing.active ? "Pause listing" : "Activate listing"}
                  </button>
                </form>
              </div>
              {!listing.active ? (
                <p className="text-center text-xs font-semibold text-amber-700">
                  Hidden from public search
                </p>
              ) : null}
            </div>
          ))}
        </div>
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
