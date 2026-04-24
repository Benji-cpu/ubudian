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
 * Szymkiewicz–Simpson overlap coefficient on whitespace-split tokens of the
 * normalized strings: |A ∩ B| / min(|A|, |B|). Complements Levenshtein, which
 * is penalized by length differences — e.g. "Clarity Breathwork" vs "Clarity
 * Breathwork w/ Ashanna Solaris & Dana Dharma Devi" has low Levenshtein
 * similarity but token overlap = 1.0 because the shorter title's tokens are a
 * full subset. Returns 0 if either input has no tokens after normalization.
 */
export function tokenOverlap(a: string, b: string): number {
  const tokensA = new Set(normalizeForComparison(a).split(" ").filter(Boolean));
  const tokensB = new Set(normalizeForComparison(b).split(" ").filter(Boolean));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let common = 0;
  for (const t of tokensA) if (tokensB.has(t)) common++;
  return common / Math.min(tokensA.size, tokensB.size);
}

/**
 * Check if two event titles are likely the same event based on fuzzy matching.
 * Accepts either (a) Levenshtein similarity >= threshold, or (b) token overlap
 * >= 0.9 with both sides having >= 2 tokens. The token-overlap branch catches
 * the common "same event, extra facilitators/subtitle" pattern that Levenshtein
 * misses because of length differences.
 */
export function titlesMatch(titleA: string, titleB: string, threshold = 0.8): boolean {
  const normA = normalizeForComparison(titleA);
  const normB = normalizeForComparison(titleB);
  if (stringSimilarity(normA, normB) >= threshold) return true;
  const tokensA = normA.split(" ").filter(Boolean);
  const tokensB = normB.split(" ").filter(Boolean);
  if (tokensA.length < 2 || tokensB.length < 2) return false;
  return tokenOverlap(titleA, titleB) >= 0.9;
}

/**
 * Calculate a combined similarity score for event comparison.
 * Weights: title (0.5), venue (0.3), date (0.2)
 */
export function eventSimilarityScore(
  eventA: { title: string; venue?: string | null; date?: string | null },
  eventB: { title: string; venue?: string | null; date?: string | null }
): number {
  const normTitleA = normalizeForComparison(eventA.title);
  const normTitleB = normalizeForComparison(eventB.title);
  const levTitleSim = stringSimilarity(normTitleA, normTitleB);
  const tokensA = normTitleA.split(" ").filter(Boolean);
  const tokensB = normTitleB.split(" ").filter(Boolean);
  // Use token overlap as a second signal when both sides have enough tokens.
  // Cap at 0.95 so exact string matches still score strictly higher.
  const overlapTitleSim =
    tokensA.length >= 2 && tokensB.length >= 2
      ? tokenOverlap(eventA.title, eventB.title) * 0.95
      : 0;
  const titleSim = Math.max(levTitleSim, overlapTitleSim);

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
