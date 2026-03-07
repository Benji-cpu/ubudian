/**
 * Levenshtein distance and fuzzy string matching utilities for event deduplication.
 */

/**
 * Calculate the Levenshtein edit distance between two strings.
 * Uses the optimized single-row Wagner–Fischer algorithm.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Ensure a is the shorter string for space optimization
  if (a.length > b.length) [a, b] = [b, a];

  const aLen = a.length;
  const bLen = b.length;
  const row = new Array<number>(aLen + 1);

  for (let i = 0; i <= aLen; i++) row[i] = i;

  for (let j = 1; j <= bLen; j++) {
    let prev = row[0];
    row[0] = j;
    for (let i = 1; i <= aLen; i++) {
      const val = a[i - 1] === b[j - 1] ? prev : Math.min(prev, row[i], row[i - 1]) + 1;
      prev = row[i];
      row[i] = val;
    }
  }

  return row[aLen];
}

/**
 * Calculate normalized similarity score between two strings.
 * Returns a value between 0 (completely different) and 1 (identical).
 */
export function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

/**
 * Normalize a string for comparison: lowercase, strip non-alphanumeric, collapse whitespace.
 */
export function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Check if two event titles are likely the same event based on fuzzy matching.
 * Uses a threshold of 0.8 similarity after normalization.
 */
export function titlesMatch(titleA: string, titleB: string, threshold = 0.8): boolean {
  const normA = normalizeForComparison(titleA);
  const normB = normalizeForComparison(titleB);
  return stringSimilarity(normA, normB) >= threshold;
}

/**
 * Calculate a combined similarity score for event comparison.
 * Weights: title (0.5), venue (0.3), date (0.2)
 */
export function eventSimilarityScore(
  eventA: { title: string; venue?: string | null; date?: string | null },
  eventB: { title: string; venue?: string | null; date?: string | null }
): number {
  const titleSim = stringSimilarity(
    normalizeForComparison(eventA.title),
    normalizeForComparison(eventB.title)
  );

  let venueSim = 0;
  if (eventA.venue && eventB.venue) {
    venueSim = stringSimilarity(
      normalizeForComparison(eventA.venue),
      normalizeForComparison(eventB.venue)
    );
  } else if (!eventA.venue && !eventB.venue) {
    venueSim = 0.3; // Both missing venue — unknown ≠ same, push to admin review
  } else {
    venueSim = 0.2; // One venue present, one missing — slight benefit of doubt
  }

  const dateSim = eventA.date && eventB.date && eventA.date === eventB.date ? 1 : 0;

  return titleSim * 0.5 + venueSim * 0.3 + dateSim * 0.2;
}
