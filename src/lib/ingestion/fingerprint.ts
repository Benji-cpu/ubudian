/**
 * Content fingerprinting for event deduplication.
 * Creates a SHA-256 hash of normalized event fields for exact-match detection.
 */

import { normalizeForComparison } from "./similarity";

/**
 * Sentinel value used when venue is null/missing.
 * Ensures events without venue info produce a distinct fingerprint
 * from events with a venue, preventing false-positive dedup collisions.
 */
export const NO_VENUE_SENTINEL = "__no_venue__";

/**
 * Generate a SHA-256 content fingerprint from normalized event fields.
 * The fingerprint is based on: normalized title + start_date + normalized venue.
 * This catches events that are the same across different sources even if
 * descriptions differ or formatting varies.
 */
export async function generateFingerprint(fields: {
  title: string;
  start_date: string;
  venue_name?: string | null;
}): Promise<string> {
  const normalized = [
    normalizeForComparison(fields.title),
    fields.start_date, // Already in YYYY-MM-DD format
    fields.venue_name ? normalizeForComparison(fields.venue_name) : NO_VENUE_SENTINEL,
  ].join("|");

  // Use Web Crypto API (available in Node.js 18+ and Edge Runtime)
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
