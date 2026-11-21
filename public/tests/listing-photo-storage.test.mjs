import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { parsePhotoUrls } from "../src/lib/listing-photos.js";
import {
  deleteListingPhoto,
  readUploadedListingPhoto,
  saveListingPhotoUploads,
  validateListingPhotoUploads,
} from "../src/lib/listing-photo-storage.js";

function upload(type, bytes, size = bytes.length) {
  const buffer = Buffer.from(bytes);
  return {
    type,
    size,
    async arrayBuffer() {
      return buffer;
    },
  };
}

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
const WEBP = Buffer.from("RIFFxxxxWEBPdata", "ascii");

async function withUploadRoot(run) {
  const previous = process.env.UPLOAD_DIR;
  const root = await mkdtemp(path.join(os.tmpdir(), "roost-photo-test-"));
  process.env.UPLOAD_DIR = root;

  try {
    await run(root);
  } finally {
    if (previous === undefined) delete process.env.UPLOAD_DIR;
    else process.env.UPLOAD_DIR = previous;
    await rm(root, { recursive: true, force: true });
  }
}

test("photo URL parsing deduplicates external http/https URLs", () => {
  assert.deepEqual(
    parsePhotoUrls(
      "https://example.com/a.jpg\nhttps://example.com/a.jpg,http://example.com/b.png"
    ),
    ["https://example.com/a.jpg", "http://example.com/b.png"]
  );
});

test("photo URL parsing rejects unsafe protocols and manual internal references", () => {
  assert.throws(
    () => parsePhotoUrls("javascript:alert(1)"),
    /Photo URLs must use http or https/
  );

  assert.throws(
    () => parsePhotoUrls("/uploads/listings/listing-1/photo.jpg"),
    /cannot be added manually/
  );

  assert.deepEqual(
    parsePhotoUrls("/uploads/listings/listing-1/photo.jpg", {
      allowedInternalUrls: ["/uploads/listings/listing-1/photo.jpg"],
    }),
    ["/uploads/listings/listing-1/photo.jpg"]
  );
});

test("upload validation enforces type, size, and five-photo total", () => {
  const png = upload("image/png", PNG);
  assert.deepEqual(validateListingPhotoUploads([png], 4), [png]);

  assert.throws(
    () => validateListingPhotoUploads([png], 5),
    /at most 5 photos/
  );

  assert.throws(
    () => validateListingPhotoUploads([upload("image/gif", Buffer.from("GIF89a"))], 0),
    /JPEG, PNG, or WebP/
  );

  assert.throws(
    () =>
      validateListingPhotoUploads(
        [upload("image/png", PNG, 5 * 1024 * 1024 + 1)],
        0
      ),
    /5 MB or smaller/
  );
});

test("valid uploaded photos can be saved, read, and deleted", async () => {
  await withUploadRoot(async () => {
    const [publicPath] = await saveListingPhotoUploads("listing_1", [
      upload("image/png", PNG),
    ]);

    assert.match(
      publicPath,
      /^\/uploads\/listings\/listing_1\/[A-Za-z0-9-]+\.png$/
    );

    const parts = publicPath.slice(1).split("/");
    const stored = await readUploadedListingPhoto(parts);
    assert.equal(stored.contentType, "image/png");
    assert.deepEqual(stored.body, PNG);

    assert.equal(await deleteListingPhoto(publicPath), true);
    assert.equal(await readUploadedListingPhoto(parts), null);
    assert.equal(await deleteListingPhoto(publicPath), false);
  });
});

test("JPEG and WebP signatures are accepted when MIME types match", async () => {
  await withUploadRoot(async () => {
    const paths = await saveListingPhotoUploads("listing-2", [
      upload("image/jpeg", JPEG),
      upload("image/webp", WEBP),
    ]);

    assert.equal(paths.length, 2);
    assert.match(paths[0], /\.jpg$/);
    assert.match(paths[1], /\.webp$/);
  });
});

test("signature mismatch rejects the upload and cleans earlier files", async () => {
  await withUploadRoot(async (root) => {
    await assert.rejects(
      saveListingPhotoUploads("listing-3", [
        upload("image/png", PNG),
        upload("image/jpeg", Buffer.from("not-a-jpeg")),
      ]),
      /contents do not match/
    );

    const directory = path.join(root, "listings", "listing-3");
    assert.deepEqual(await readdir(directory), []);
  });
});

test("storage rejects unsafe listing identifiers and traversal-shaped reads", async () => {
  await withUploadRoot(async () => {
    await assert.rejects(
      saveListingPhotoUploads("../../escape", [upload("image/png", PNG)]),
      /Invalid listing identifier/
    );

    assert.equal(
      await readUploadedListingPhoto(["listings", "..", "photo.png"]),
      null
    );
    assert.equal(
      await deleteListingPhoto("/uploads/listings/../photo.png"),
      false
    );
  });
});
