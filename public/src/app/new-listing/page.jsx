import { requireUser } from "@/lib/auth";
import { createListing } from "./actions";
import { AMENITIES } from "@/lib/amenities";

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  await requireUser();
  return (
    <section className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-sm font-semibold text-sky-700">Hosting</p>
      <h1 className="text-4xl font-bold tracking-tight">Create a listing</h1>
      <p className="mt-2 text-slate-500">
        Add a stay directly to the PostgreSQL-backed Roost catalog.
      </p>

      <form
        action={createListing}
        className="mt-8 space-y-5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
      >
        {[
          ["title", "Title", "A memorable name for your stay", "text"],
          ["location", "Location", "City, region, or destination", "text"],
          ["placeType", "Stay type", "Cabin, house, camper, tiny home…", "text"],
          ["locationType", "Setting", "Mountains, waterfront, city…", "text"],
          ["price", "Nightly price", "189", "number"],
          ["guests", "Guests", "4", "number"],
          ["bedrooms", "Bedrooms", "2", "number"],
        ].map(([name, label, placeholder, type]) => (
          <label key={name} className="block">
            <span className="mb-2 block text-sm font-semibold">{label}</span>
            <input
              name={name}
              type={type}
              min={type === "number" ? "1" : undefined}
              required={["title", "location", "placeType", "price"].includes(name)}
              placeholder={placeholder}
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
            placeholder={"https://example.com/photo-1.jpg\nhttps://example.com/photo-2.jpg"}
            rows={4}
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
            placeholder="What makes this place special?"
            rows={5}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-sky-500"
          />
        </label>
        <button className="w-full rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800">
          Save listing
        </button>
      </form>
    </section>
  );
}
