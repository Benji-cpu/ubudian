/**
 * Downloads a remote image and re-uploads it to the Supabase `images` bucket
 * so the URL doesn't rot. Returns the Supabase public URL, or null on any
 * failure (never throws).
 */

import { createAdminClient } from "@/lib/supabase/admin";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const TIMEOUT_MS = 10_000;

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function persistRemoteImage(
  remoteUrl: string,
  folder: string,
  keyHint: string
): Promise<string | null> {
  if (!remoteUrl || !/^https?:\/\//i.test(remoteUrl)) return null;

  let contentType: string;
  let bytes: Uint8Array;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(remoteUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": "UbudianBot/1.0 (+https://ubudian-v1.vercel.app)" },
    });
    clearTimeout(timer);

    if (!res.ok) return null;

    contentType = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();

    const lenHeader = Number(res.headers.get("content-length"));
    if (lenHeader && lenHeader > MAX_BYTES) return null;

    const buf = await res.arrayBuffer();
    if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) return null;
    bytes = new Uint8Array(buf);

    // If the server didn't send a recognizable image content-type
    // (Telegram serves application/octet-stream), sniff the magic bytes.
    if (!MIME_EXT[contentType]) {
      const sniffed = sniffImageMime(bytes);
      if (!sniffed) return null;
      contentType = sniffed;
    }
  } catch {
    return null;
  }

  const ext = MIME_EXT[contentType];
  const safeKey = keyHint.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "image";
  const fileName = `${folder}/${safeKey}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const supabase = createAdminClient();
  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(fileName, bytes, { contentType, upsert: false });

  if (uploadError) return null;

  const { data } = supabase.storage.from("images").getPublicUrl(fileName);
  return data.publicUrl || null;
}

function sniffImageMime(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  // GIF: 47 49 46 38 (GIF8)
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return "image/gif";
  }
  // WebP: "RIFF" .... "WEBP"
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}
