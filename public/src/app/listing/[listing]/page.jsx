import Link from "next/link";
import { notFound } from "next/navigation";
import { getListingById } from "@/lib/listings";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toggleWishlist } from "@/app/stay-actions";
import BookingForm from "./components/BookingForm";
import { parseDateInput, toDateInputValue, todayUtc } from "@/lib/pricing";

export const dynamic = "force-dynamic";

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

  const [reviews, reviewCount] = await Promise.all([
    prisma.review.findMany({
      where: { listingId: id },
      include: {
        user: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.review.count({ where: { listingId: id } }),
  ]);

  const ownsListing = Boolean(user && databaseListing?.ownerId === user.id);
  const tomorrow = todayUtc();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const dayAfter = todayUtc();
  dayAfter.setUTCDate(dayAfter.getUTCDate() + 2);

  const searchedStart = parseDateInput(query?.startsAt);
  const searchedEnd = parseDateInput(query?.endsAt);
  const searchedGuests = Number.parseInt(String(query?.guests ?? "1"), 10);
  const validSearchDates = Boolean(
    searchedStart &&
    searchedEnd &&
    searchedEnd > searchedStart &&
    searchedStart >= todayUtc()
  );

  const defaultStart = validSearchDates ? searchedStart : tomorrow;
  const defaultEnd = validSearchDates ? searchedEnd : dayAfter;
  const defaultGuests = Number.isFinite(searchedGuests)
    ? Math.min(Math.max(searchedGuests, 1), listing.guests)
    : 1;

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
            {listing.bedrooms === 1 ? "" : "s"} ·{" "}
            {listing.rating > 0
              ? `★ ${listing.rating.toFixed(1)} · ${reviewCount} review${reviewCount === 1 ? "" : "s"}`
              : "New — no reviews yet"}
          </p>
          <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-700">
            {listing.description}
          </p>
          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-sm text-slate-500">Hosted by</p>
            <p className="font-semibold">{listing.owner}</p>
          </div>

          <section className="mt-10 border-t border-slate-200 pt-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-sky-700">Guest feedback</p>
                <h2 className="mt-1 text-2xl font-bold">Verified stay reviews</h2>
              </div>
              {listing.rating > 0 ? (
                <p className="font-semibold">
                  ★ {listing.rating.toFixed(1)} · {reviewCount} review
                  {reviewCount === 1 ? "" : "s"}
                </p>
              ) : null}
            </div>

            {reviews.length ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {reviews.map((review) => {
                  const reviewer =
                    [review.user.firstName, review.user.lastName]
                      .filter(Boolean)
                      .join(" ") || `@${review.user.username}`;

                  return (
                    <article
                      key={review.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-semibold">{reviewer}</p>
                        <p className="text-sm font-semibold">
                          {"★".repeat(review.rating)}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Verified stay ·{" "}
                        {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          year: "numeric",
                        }).format(review.createdAt)}
                      </p>
                      {review.comment ? (
                        <p className="mt-3 leading-6 text-slate-700">
                          {review.comment}
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                No verified reviews yet.
              </div>
            )}
          </section>
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
              defaultStart={toDateInputValue(defaultStart)}
              defaultEnd={toDateInputValue(defaultEnd)}
              maxGuests={listing.guests}
              defaultGuests={defaultGuests}
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
