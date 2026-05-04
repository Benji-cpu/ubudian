/**
 * Lightweight title similarity used by the daily-maintenance dedup pass.
 *
 * Pure JS so we don't need pg_trgm at runtime. Combines Jaccard over token
 * bigrams (catches reordering, missing words) with a substring boost (catches
 * "Ecstatic Dance" vs "Ecstatic Dance Sunday Edition").
 *
 * Returns a score in [0, 1]. Identical strings return 1.
 */
export function titleSimilarity(a: string, b: string): number {
  const na = normalise(a);
  const nb = normalise(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;

  const bigramsA = bigrams(na);
  const bigramsB = bigrams(nb);
  if (bigramsA.size === 0 || bigramsB.size === 0) return 0;

  let intersection = 0;
  for (const g of bigramsA) {
    if (bigramsB.has(g)) intersection += 1;
  }
  const union = bigramsA.size + bigramsB.size - intersection;
  const jaccard = union === 0 ? 0 : intersection / union;

  // Substring boost: if one canonical title is a prefix or suffix of the
  // other, push similarity up. Caps at 1.
  let boost = 0;
  if (na.length >= 6 && nb.length >= 6) {
    if (nb.startsWith(na) || nb.endsWith(na) || na.startsWith(nb) || na.endsWith(nb)) {
      boost = 0.15;
    }
  }

  return Math.min(1, jaccard + boost);
}

function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u2018\u2019\u2013\u2014]/g, "'")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function bigrams(s: string): Set<string> {
  const tokens = s.split(" ").filter(Boolean);
  const out = new Set<string>();
  if (tokens.length === 1) {
    out.add(tokens[0]);
    return out;
  }
  for (let i = 0; i < tokens.length - 1; i += 1) {
    out.add(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return out;
}
