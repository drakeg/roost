import { NextResponse } from "next/server";
import { readUploadedListingPhoto } from "@/lib/listing-photo-storage";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const { path } = await params;
  const photo = await readUploadedListingPhoto(path);

  if (!photo) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(photo.body, {
    headers: {
      "Content-Type": photo.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
