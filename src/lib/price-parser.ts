export interface ParsedPrice {
  min: number;
  max: number;
}

export type PriceBracket =
  | "free"
  | "under-100k"
  | "100k-300k"
  | "300k-500k"
  | "500k-plus";

export const PRICE_BRACKETS: {
  value: PriceBracket;
  label: string;
}[] = [
  { value: "free", label: "Free" },
  { value: "under-100k", label: "Under 100k" },
  { value: "100k-300k", label: "100k\u2013300k" },
  { value: "300k-500k", label: "300k\u2013500k" },
  { value: "500k-plus", label: "500k+" },
];

/**
 * Parse a free-text price_info string into a numeric min/max range in IDR.
 * Returns null if the string is empty or unparseable.
 */
export function parsePriceFromText(
  priceInfo: string | null
): ParsedPrice | null {
  if (!priceInfo || !priceInfo.trim()) return null;

  const lower = priceInfo.toLowerCase().trim();

  // "free" or "gratis" → zero
  if (/\bfree\b/.test(lower) || /\bgratis\b/.test(lower)) {
    return { min: 0, max: 0 };
  }

  // Extract all number-like tokens: "Rp 55,000", "500k", "300.000", plain "250000"
  const numbers: number[] = [];

  // Match patterns like "500k", "1.5m" first
  const kPattern = /(\d+(?:[.,]\d+)?)\s*k\b/gi;
  let kMatch;
  while ((kMatch = kPattern.exec(priceInfo)) !== null) {
    const num = parseFloat(kMatch[1].replace(",", "."));
    numbers.push(num * 1_000);
  }

  // Match patterns like "55,000" or "55.000" or "250000" (skip if already captured via k)
  if (numbers.length === 0) {
    const numPattern = /(\d{1,3}(?:[.,]\d{3})+|\d{4,})/g;
    let numMatch;
    while ((numMatch = numPattern.exec(priceInfo)) !== null) {
      // Normalize: strip separators
      const cleaned = numMatch[1].replace(/[.,]/g, "");
      const parsed = parseInt(cleaned, 10);
      if (!isNaN(parsed)) numbers.push(parsed);
    }
  }

  if (numbers.length === 0) return null;

  if (numbers.length === 1) {
    return { min: numbers[0], max: numbers[0] };
  }

  return { min: Math.min(...numbers), max: Math.max(...numbers) };
}

/**
 * Check if a price_info string matches a given price bracket.
 * If price_info is unparseable, returns true (show in all brackets).
 */
export function matchesPriceBracket(
  priceInfo: string | null,
  bracket: PriceBracket
): boolean {
  const parsed = parsePriceFromText(priceInfo);

  // Unparseable → show in all brackets
  if (parsed === null) return true;

  switch (bracket) {
    case "free":
      return parsed.min === 0 && parsed.max === 0;
    case "under-100k":
      return parsed.min > 0 && parsed.min < 100_000;
    case "100k-300k":
      return parsed.min >= 100_000 && parsed.min <= 300_000;
    case "300k-500k":
      return parsed.min > 300_000 && parsed.min <= 500_000;
    case "500k-plus":
      return parsed.min > 500_000;
    default:
      return true;
  }
}
