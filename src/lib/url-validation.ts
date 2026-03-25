/**
 * Validates that a URL uses a safe protocol (http or https only).
 * Rejects javascript:, data:, vbscript:, and other dangerous protocols.
 * Returns false for empty/null/undefined values (caller decides if empty is OK).
 */
export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Zod refinement for URL fields — allows empty strings but validates non-empty as safe URLs.
 * Use with `.refine(safeUrlOrEmpty, "URL must use http or https")`.
 */
export function safeUrlOrEmpty(value: string | undefined): boolean {
  if (!value || value === "") return true;
  return isSafeUrl(value);
}
