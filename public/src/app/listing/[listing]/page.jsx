import Link from "next/link";
import { notFound } from "next/navigation";
import { getListingById } from "@/lib/listings";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toggleWishlist } from "@/app/stay-actions";
import BookingForm from "./components/BookingForm";

export const dynamic = "force-dynamic";

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

export default async function ListingPage({ params, searchParams }) {
  const { listing: id } = await params;
  const query = await searchParams;
  const listing = await getListingById(id);

  if (!listing) notFound();

  const user = await getCurrentUser();
  const databaseListing = user
    ? await prisma.listing.findUnique({
        where: { id },
        select: { ownerId: true },
      })
    : null;

  const saved = user
    ? Boolean(
        await prisma.wishlist.findUnique({
          where: {
            userId_listingId: {
              userId: user.id,
              listingId: id,
            },
          },
        })
      )
    : false;

  const ownsListing = Boolean(user && databaseListing?.ownerId === user.id);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/search" className="text-sm font-semibold text-sky-700">
        ← Back to stays
      </Link>
      <div className="mt-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-sky-200 via-indigo-100 to-amber-100">
        {listing.photos?.length ? (
          <div className="grid gap-1 sm:grid-cols-2">
            <img
              src={listing.photos[0]}
              alt={listing.title}
              className="h-80 w-full object-cover sm:h-[28rem]"
            />
            <div className="grid grid-cols-2 gap-1">
              {listing.photos.slice(1, 5).map((photo, index) => (
                <img
                  key={photo}
                  src={photo}
                  alt={`${listing.title} photo ${index + 2}`}
                  className="h-40 w-full object-cover sm:h-[13.875rem]"
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="h-80 sm:h-[28rem]" />
        )}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
        <div>
          <p className="text-sm font-semibold text-sky-700">
            {listing.placeType} · {listing.locationType}
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">{listing.title}</h1>
          <p className="mt-3 text-slate-500">
            {listing.location} · {listing.guests} guests · {listing.bedrooms} bedroom
            {listing.bedrooms === 1 ? "" : "s"} · ★ {listing.rating}
          </p>
          <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-700">
            {listing.description}
          </p>
          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-sm text-slate-500">Hosted by</p>
            <p className="font-semibold">{listing.owner}</p>
          </div>
        </div>

        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
          <p className="text-2xl font-bold">
            ${listing.price}{" "}
            <span className="text-base font-normal text-slate-500">/ night</span>
          </p>

          {query?.error ? (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {query.error}
            </p>
          ) : null}

          {user ? (
            <form action={toggleWishlist} className="mt-5">
              <input type="hidden" name="listingId" value={listing.id} />
              <button className="w-full rounded-2xl border border-slate-300 px-5 py-3 font-semibold hover:border-sky-400">
                {saved ? "Remove from wishlist" : "Save to wishlist"}
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="mt-5 block rounded-2xl border border-slate-300 px-5 py-3 text-center font-semibold"
            >
              Sign in to save
            </Link>
          )}

          {ownsListing ? (
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              This is your listing, so reservations are disabled.
            </div>
          ) : user ? (
            <BookingForm
              listingId={listing.id}
              nightlyRate={listing.price}
              defaultStart={toDateInputValue(tomorrow)}
              defaultEnd={toDateInputValue(dayAfter)}
            />
          ) : (
            <Link
              href="/login"
              className="mt-5 block rounded-2xl bg-sky-400 px-5 py-4 text-center font-bold text-slate-950"
            >
              Sign in to reserve
            </Link>
          )}
        </aside>
      </div>
    </section>
  );
}
