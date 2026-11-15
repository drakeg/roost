const INTERNAL_UPLOAD_PATTERN =
  /^\/uploads\/listings\/[A-Za-z0-9_-]+\/[A-Za-z0-9-]+\.(?:jpg|jpeg|png|webp)$/;

export function parsePhotoUrls(value, { allowedInternalUrls = [] } = {}) {
  const raw = String(value ?? "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

  const unique = [...new Set(raw)].slice(0, 5);
  const allowedInternal = new Set(allowedInternalUrls);

  for (const url of unique) {
    if (INTERNAL_UPLOAD_PATTERN.test(url)) {
      if (!allowedInternal.has(url)) {
        throw new Error("Uploaded photo references cannot be added manually.");
      }
      continue;
    }

    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error("Each photo must be a valid http/https URL or an existing uploaded photo.");
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Photo URLs must use http or https.");
    }
  }

  return unique;
}
