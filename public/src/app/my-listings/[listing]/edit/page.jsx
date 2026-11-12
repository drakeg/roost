import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { updateListing } from "./actions";
import { AMENITIES } from "@/lib/amenities";

export const dynamic = "force-dynamic";

export default async function EditListingPage({ params }) {
  const user = await requireUser();
  const { listing: id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
  });

  if (!listing) notFound();

  if (listing.ownerId !== user.id && user.role !== "ADMIN") {
    redirect("/my-listings");
  }

  const action = updateListing.bind(null, listing.id);

  return (
    <section className="mx-auto max-w-3xl px-6 py-10">
      <Link href={`/listing/${listing.id}`} className="text-sm font-semibold text-sky-700">
        ← Back to listing
      </Link>
      <p className="mt-6 text-sm font-semibold text-sky-700">Hosting</p>
      <h1 className="text-4xl font-bold tracking-tight">Edit listing</h1>
      <p className="mt-2 text-slate-500">
        Update the details guests see when browsing this stay.
      </p>

      <form
        action={action}
        className="mt-8 space-y-5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
      >
        {[
          ["title", "Title", listing.title, "text"],
          ["location", "Location", listing.location, "text"],
          ["placeType", "Stay type", listing.placeType, "text"],
          ["locationType", "Setting", listing.locationType, "text"],
          ["price", "Nightly price", listing.price, "number"],
          ["guests", "Guests", listing.guests, "number"],
          ["bedrooms", "Bedrooms", listing.bedrooms, "number"],
        ].map(([name, label, value, type]) => (
          <label key={name} className="block">
            <span className="mb-2 block text-sm font-semibold">{label}</span>
            <input
              name={name}
              type={type}
              min={type === "number" ? "1" : undefined}
              required={["title", "location", "placeType", "price"].includes(name)}
              defaultValue={value}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-sky-500"
            />
          </label>
        ))}

        <fieldset>
          <legend className="mb-3 text-sm font-semibold">Amenities</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {AMENITIES.map((amenity) => (
              <label
                key={amenity.value}
                className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3"
              >
                <input
                  type="checkbox"
                  name="amenities"
                  value={amenity.value}
                  defaultChecked={listing.amenities.includes(amenity.value)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">{amenity.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Photo URLs</span>
          <textarea
            name="photos"
            rows={4}
            defaultValue={Array.isArray(listing.photos) ? listing.photos.join("\n") : ""}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-sky-500"
          />
          <span className="mt-2 block text-xs text-slate-500">
            Add up to five image URLs, one per line.
          </span>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Description</span>
          <textarea
            name="description"
            rows={6}
            defaultValue={listing.description ?? ""}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-sky-500"
          />
        </label>

        <div className="flex gap-3">
          <button className="flex-1 rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800">
            Save changes
          </button>
          <Link
            href={`/listing/${listing.id}`}
            className="rounded-xl border border-slate-300 px-5 py-3 text-center font-semibold"
          >
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
