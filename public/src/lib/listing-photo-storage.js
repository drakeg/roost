import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const MAX_PHOTOS = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const MIME_TO_EXTENSION = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
const EXTENSION_TO_MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function uploadRoot() {
  return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));
}

function listingDirectory(listingId) {
  return path.join(uploadRoot(), "listings", listingId);
}

function isFileUpload(value) {
  return value && typeof value === "object" && typeof value.arrayBuffer === "function";
}

function matchesImageSignature(buffer, mimeType) {
  if (mimeType === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === "image/png") {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  if (mimeType === "image/webp") {
    return (
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    );
  }

  return false;
}

export function validateListingPhotoUploads(values, existingCount = 0) {
  const files = values.filter((value) => isFileUpload(value) && value.size > 0);

  if (existingCount + files.length > MAX_PHOTOS) {
    throw new Error(`Listings can have at most ${MAX_PHOTOS} photos.`);
  }

  for (const file of files) {
    if (!MIME_TO_EXTENSION[file.type]) {
      throw new Error("Uploaded photos must be JPEG, PNG, or WebP images.");
    }

    if (file.size > MAX_BYTES) {
      throw new Error("Each uploaded photo must be 5 MB or smaller.");
    }
  }

  return files;
}

export async function saveListingPhotoUploads(listingId, files) {
  if (!files.length) return [];

  const directory = listingDirectory(listingId);
  await mkdir(directory, { recursive: true });

  const savedPaths = [];

  try {
    for (const file of files) {
      const extension = MIME_TO_EXTENSION[file.type];
      const filename = `${randomUUID()}${extension}`;
      const absolutePath = path.join(directory, filename);
      const buffer = Buffer.from(await file.arrayBuffer());

      if (!matchesImageSignature(buffer, file.type)) {
        throw new Error("Uploaded file contents do not match the selected image type.");
      }

      await writeFile(absolutePath, buffer, { flag: "wx" });
      savedPaths.push({
        absolutePath,
        publicPath: `/uploads/listings/${listingId}/${filename}`,
      });
    }
  } catch (error) {
    await Promise.allSettled(savedPaths.map((saved) => unlink(saved.absolutePath)));
    throw error;
  }

  return savedPaths.map((saved) => saved.publicPath);
}

export async function deleteListingPhoto(publicPath) {
  const match = String(publicPath ?? "").match(
    /^\/uploads\/listings\/([A-Za-z0-9_-]+)\/([A-Za-z0-9-]+\.(?:jpg|jpeg|png|webp))$/
  );

  if (!match) return false;

  const absolutePath = path.resolve(listingDirectory(match[1]), match[2]);
  const root = listingDirectory(match[1]);

  if (!absolutePath.startsWith(`${root}${path.sep}`)) return false;

  try {
    await unlink(absolutePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

export async function readUploadedListingPhoto(parts) {
  if (!Array.isArray(parts) || parts.length !== 3 || parts[0] !== "listings") {
    return null;
  }

  const [_, listingId, filename] = parts;
  if (!/^[A-Za-z0-9_-]+$/.test(listingId)) return null;
  if (!/^[A-Za-z0-9-]+\.(jpg|jpeg|png|webp)$/.test(filename)) return null;

  const absolutePath = path.resolve(listingDirectory(listingId), filename);
  const root = listingDirectory(listingId);
  if (!absolutePath.startsWith(`${root}${path.sep}`)) return null;

  try {
    const body = await readFile(absolutePath);
    const contentType = EXTENSION_TO_MIME[path.extname(filename).toLowerCase()];
    return { body, contentType };
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export { MAX_PHOTOS };
