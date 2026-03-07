/**
 * Venue name normalization using the venue_aliases table.
 * Resolves alternate venue names to canonical names for improved dedup accuracy.
 * Three-pass resolution: exact alias → stripped suffix → fuzzy match.
 * Tracks unresolved venues for admin review.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeForComparison, stringSimilarity } from "./similarity";

// In-memory cache of aliases, refreshed periodically
let aliasCache: Map<string, string> | null = null;
let canonicalNamesCache: string[] | null = null;
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const FUZZY_MATCH_THRESHOLD = 0.85;

/**
 * Load venue aliases from the database into an in-memory cache.
 * Keys are lowercased alias strings, values are canonical names.
 */
async function loadAliasCache(): Promise<Map<string, string>> {
  const now = Date.now();
  if (aliasCache && now - cacheLoadedAt < CACHE_TTL_MS) {
    return aliasCache;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("venue_aliases")
    .select("canonical_name, alias");

  if (error) {
    console.error("[venue-normalizer] Failed to load aliases:", error);
    return aliasCache ?? new Map();
  }

  const cache = new Map<string, string>();
  const canonicalSet = new Set<string>();
  for (const row of data ?? []) {
    cache.set(normalizeForComparison(row.alias), row.canonical_name);
    canonicalSet.add(row.canonical_name);
  }

  aliasCache = cache;
  canonicalNamesCache = Array.from(canonicalSet);
  cacheLoadedAt = now;
  return cache;
}

/**
 * Load canonical venue names for fuzzy matching.
 */
async function loadCanonicalNames(): Promise<string[]> {
  if (canonicalNamesCache && Date.now() - cacheLoadedAt < CACHE_TTL_MS) {
    return canonicalNamesCache;
  }
  // loadAliasCache populates both caches
  await loadAliasCache();
  return canonicalNamesCache ?? [];
}

/**
 * Normalize a venue name to its canonical form.
 * 1. Check alias cache for an exact match (after normalization)
 * 2. Try without common suffixes like "ubud", "bali", "indonesia"
 * 3. Fuzzy match against all canonical venue names (≥ 0.85 similarity)
 * If all passes fail, tracks as an unresolved venue for admin review.
 */
export async function normalizeVenue(venueName: string | null | undefined): Promise<string | null> {
  if (!venueName?.trim()) return null;

  const cache = await loadAliasCache();
  const normalized = normalizeForComparison(venueName);

  // Pass 1: Direct alias lookup
  const canonical = cache.get(normalized);
  if (canonical) return canonical;

  // Pass 2: Try without common suffixes like "ubud", "bali"
  const stripped = normalized
    .replace(/\b(ubud|bali|indonesia)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const strippedMatch = cache.get(stripped);
  if (strippedMatch) return strippedMatch;

  // Pass 3: Fuzzy match against canonical names
  const canonicalNames = await loadCanonicalNames();
  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const name of canonicalNames) {
    const score = stringSimilarity(normalized, normalizeForComparison(name));
    if (score >= FUZZY_MATCH_THRESHOLD && score > bestScore) {
      bestScore = score;
      bestMatch = name;
    }
  }

  if (bestMatch) return bestMatch;

  // All passes failed — track as unresolved venue (fire-and-forget)
  trackUnresolvedVenue(venueName.trim(), normalized).catch((err) => {
    console.error("[venue-normalizer] Failed to track unresolved venue:", err);
  });

  return venueName.trim();
}

/**
 * Track a venue name that couldn't be resolved to any known canonical name.
 * Uses the increment_venue_seen_count RPC for atomic upsert.
 */
async function trackUnresolvedVenue(rawName: string, normalizedName: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.rpc("increment_venue_seen_count", {
    p_normalized_name: normalizedName,
    p_raw_name: rawName,
  });

  if (error) {
    console.error("[venue-normalizer] Failed to upsert unresolved venue:", error);
  }
}

/**
 * Clear the alias cache (useful after admin updates aliases).
 */
export function clearVenueAliasCache(): void {
  aliasCache = null;
  canonicalNamesCache = null;
  cacheLoadedAt = 0;
}
