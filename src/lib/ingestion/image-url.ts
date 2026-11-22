/**
 * Only absolute http(s) image URLs are stored as an event cover.
 *
 * Megatix returns the site-relative placeholder "/images/cover.png" for events
 * without artwork. Stored as-is, it resolved against our own domain and showed
 * a broken image on 118 events (found 22 Nov 2026).
 */
export function absoluteImageUrl(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
}
