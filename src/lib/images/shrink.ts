/**
 * Shrinks an image before it goes into the Supabase `images` bucket.
 *
 * Why: the site serves stored images straight from Supabase (next/image is
 * `unoptimized`), so every reader and crawler downloads the stored bytes.
 * Originals of up to 5 MB each took the project over its egress quota in
 * November 2026 and Supabase blocked the whole database.
 *
 * Output is always JPEG: it works in browsers, email clients, the OG image
 * renderer and the vision model. GIFs pass through untouched (they may be
 * animated). Never throws: on any failure the original bytes come back.
 */

import sharp from "sharp";

export const WEB_IMAGE_MAX_WIDTH = 1280;
export const WEB_IMAGE_MAX_HEIGHT = 2400;
const JPEG_QUALITY = 72;

/** One year. Stored file names are unique, so the bytes never change. */
export const STORAGE_CACHE_SECONDS = "31536000";

export interface ShrunkImage {
  bytes: Uint8Array;
  contentType: string;
  ext: string;
}

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function shrinkForWeb(
  input: Uint8Array,
  contentType: string
): Promise<ShrunkImage> {
  const type = (contentType || "").split(";")[0].trim().toLowerCase();
  const original: ShrunkImage = {
    bytes: input,
    contentType: type || "application/octet-stream",
    ext: EXT[type] ?? "jpg",
  };

  if (type === "image/gif") return original;

  try {
    const out = await sharp(input, { failOn: "none" })
      .rotate() // apply the camera's orientation, then drop the metadata
      .resize({
        width: WEB_IMAGE_MAX_WIDTH,
        height: WEB_IMAGE_MAX_HEIGHT,
        fit: "inside",
        withoutEnlargement: true,
      })
      .flatten({ background: "#ffffff" }) // transparent PNGs get a white ground
      .jpeg({ quality: JPEG_QUALITY, progressive: true, mozjpeg: true })
      .toBuffer();

    // A small, already well-compressed JPEG can come out bigger. Keep it then.
    if (type.startsWith("image/jp") && out.byteLength >= input.byteLength) {
      return original;
    }

    return { bytes: new Uint8Array(out), contentType: "image/jpeg", ext: "jpg" };
  } catch {
    return original;
  }
}
