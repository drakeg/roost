import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toDateInputValue, todayUtc } from "@/lib/pricing";
import { createListingBlock, deleteListingBlock } from "./actions";

export const dynamic = "force-dynamic";

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

export default async function ListingAvailabilityPage({ params, searchParams }) {
  const user = await requireUser();
  const { listing: id } = await params;
  const query = await searchParams;

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      ownerId: true,
      blocks: {
        where: { endsAt: { gt: todayUtc() } },
        orderBy: { startsAt: "asc" },
      },
    },
  });

  if (!listing) notFound();

  if (listing.ownerId !== user.id && user.role !== "ADMIN") {
    redirect("/my-listings");
  }

  const tomorrow = todayUtc();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const dayAfter = todayUtc();
  dayAfter.setUTCDate(dayAfter.getUTCDate() + 2);

  return (
    <section className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/my-listings" className="text-sm font-semibold text-sky-700">
        ← Back to my listings
      </Link>

      <p className="mt-6 text-sm font-semibold text-sky-700">Hosting</p>
      <h1 className="text-4xl font-bold tracking-tight">Availability</h1>
      <p className="mt-2 text-slate-500">
        Block dates when {listing.title} should not accept reservation requests.
      </p>

      {query?.saved ? (
        <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
          Dates blocked.
        </p>
      ) : null}

      {query?.removed ? (
        <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
          Blocked dates removed.
        </p>
      ) : null}

      {query?.error ? (
        <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {query.error}
        </p>
      ) : null}

      <form
        action={createListingBlock}
        className="mt-8 grid gap-4 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:grid-cols-2"
      >
        <input type="hidden" name="listingId" value={listing.id} />

        <label>
          <span className="mb-2 block text-sm font-semibold">Block from</span>
          <input
            type="date"
            name="startsAt"
            min={toDateInputValue(todayUtc())}
            defaultValue={toDateInputValue(tomorrow)}
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>

        <label>
          <span className="mb-2 block text-sm font-semibold">Through</span>
          <input
            type="date"
            name="endsAt"
            min={toDateInputValue(tomorrow)}
            defaultValue={toDateInputValue(dayAfter)}
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>

        <label className="md:col-span-2">
          <span className="mb-2 block text-sm font-semibold">Note</span>
          <input
            name="note"
            maxLength={200}
            placeholder="Personal use, maintenance, turnover…"
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>

        <div className="md:col-span-2">
          <button className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white">
            Block dates
          </button>
        </div>
      </form>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <h2 className="text-xl font-bold">Upcoming blocked dates</h2>
        <p className="mt-1 text-sm text-slate-500">
          Blocked ranges are excluded from guest search and reservation requests.
        </p>

        {listing.blocks.length ? (
          <div className="mt-5 space-y-3">
            {listing.blocks.map((block) => (
              <article
                key={block.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">
                    {formatDate(block.startsAt)} → {formatDate(block.endsAt)}
                  </p>
                  {block.note ? (
                    <p className="mt-1 text-sm text-slate-500">{block.note}</p>
                  ) : null}
                </div>

                <form action={deleteListingBlock}>
                  <input type="hidden" name="blockId" value={block.id} />
                  <button className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
                    Remove block
                  </button>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
            No upcoming blocked dates.
          </p>
        )}
      </section>
    </section>
  );
}
