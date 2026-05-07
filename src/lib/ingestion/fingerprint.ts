/**
 * Content fingerprinting for event deduplication.
 * Creates a SHA-256 hash of normalized event fields for exact-match detection.
 */

import { normalizeForComparison } from "./similarity";
import { parseRecurrenceRule } from "@/lib/recurrence";

/**
 * Generate a SHA-256 content fingerprint from normalized event fields.
 *
 * For one-off events: normalized title + start_date. Venue is excluded so that
 * re-posts with venue spelling variations ("Blossom Ubud" vs "Blossom Space
 * Ubud") still match. Layer 3 fuzzy still considers venue.
 *
 * For recurring events with a parseable rule: normalized title + venue +
 * canonical rule signature, *replacing* start_date. Otherwise next week's
 * re-ingestion of the same weekly slot would generate a fresh seed date,
 * a fresh fingerprint, and slip past Layer 2 dedup.
 */
export async function generateFingerprint(fields: {
  title: string;
  start_date: string;
  venue_name?: string | null;
  is_recurring?: boolean | null;
  recurrence_rule?: string | null;
}): Promise<string> {
  const rule = fields.is_recurring ? parseRecurrenceRule(fields.recurrence_rule ?? null) : null;
  let dateOrRuleKey: string;
  if (rule) {
    const venueKey = fields.venue_name
      ? normalizeForComparison(fields.venue_name)
      : "novenue";
    const ruleKey = `recurring:${rule.frequency}:${rule.day_of_week ?? rule.day_of_month ?? "x"}`;
    dateOrRuleKey = `${ruleKey}|${venueKey}`;
  } else {
    dateOrRuleKey = fields.start_date;
  }

  const normalized = [normalizeForComparison(fields.title), dateOrRuleKey].join("|");

  // Use Web Crypto API (available in Node.js 18+ and Edge Runtime)
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
