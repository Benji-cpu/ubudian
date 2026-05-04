/**
 * Content fingerprinting for event deduplication.
 * Creates a SHA-256 hash of normalized event fields for exact-match detection.
 */

import { normalizeForComparison } from "./similarity";

/**
 * Generate a SHA-256 content fingerprint from normalized event fields.
 * Based on normalized title + start_date. Venue is intentionally excluded because
 * the same event is often re-posted with venue spelling variations (e.g. "Blossom
 * Ubud" vs "Blossom Space Ubud") that would otherwise produce different fingerprints
 * and defeat Layer 2 dedup. Venue is still used in Layer 3 fuzzy matching.
 */
export async function generateFingerprint(fields: {
  title: string;
  start_date: string;
  venue_name?: string | null;
}): Promise<string> {
  void fields.venue_name;
  const normalized = [
    normalizeForComparison(fields.title),
    fields.start_date, // Already in YYYY-MM-DD format
  ].join("|");

  // Use Web Crypto API (available in Node.js 18+ and Edge Runtime)
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
