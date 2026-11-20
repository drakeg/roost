import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setListingFeatured, setUserRole } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  const [users, listings, tripCount, wishlistCount] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        _count: {
          select: {
            listings: true,
            trips: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.listing.findMany({
      include: {
        owner: {
          select: { username: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.trip.count(),
    prisma.wishlist.count(),
  ]);

  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <p className="text-sm font-semibold text-sky-700">Administration</p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl font-bold tracking-tight">Roost admin</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/audit"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:border-sky-400 hover:text-sky-700"
          >
            Audit history
          </Link>
          <Link
            href="/admin/reservations"
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Reservation reporting
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {[
          ["Users", users.length],
          ["Listings", listings.length],
          ["Trips", tripCount],
          ["Wishlists", wishlistCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 xl:grid-cols-2">
        <section>
          <h2 className="text-2xl font-bold">Users</h2>
          <div className="mt-4 space-y-3">
            {users.map((user) => (
              <article key={user.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">@{user.username}</p>
                    <p className="text-sm text-slate-500">
                      {user._count.listings} listings · {user._count.trips} trips
                    </p>
                  </div>
                  <form action={setUserRole}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input
                      type="hidden"
                      name="role"
                      value={user.role === "ADMIN" ? "USER" : "ADMIN"}
                    />
                    <button className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold">
                      {user.role === "ADMIN" ? "Make user" : "Make admin"}
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Listings</h2>
          <div className="mt-4 space-y-3">
            {listings.map((listing) => (
              <article key={listing.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Link href={`/listing/${listing.id}`} className="font-semibold hover:text-sky-700">
                        {listing.title}
                      </Link>
                      <Link
                        href={`/my-listings/${listing.id}/edit`}
                        className="text-xs font-semibold text-sky-700"
                      >
                        Edit
                      </Link>
                    </div>
                    <p className="text-sm text-slate-500">
                      {listing.location} · @{listing.owner?.username ?? "unassigned"}
                    </p>
                  </div>
                  <form action={setListingFeatured}>
                    <input type="hidden" name="listingId" value={listing.id} />
                    <input type="hidden" name="featured" value={String(!listing.featured)} />
                    <button className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold">
                      {listing.featured ? "Unfeature" : "Feature"}
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
