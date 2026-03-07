/**
 * Date validation and normalization for LLM-parsed event dates.
 * Ensures dates are in YYYY-MM-DD format and within a reasonable range.
 */

export interface DateValidationResult {
  valid: boolean;
  normalized: string | null;
  error?: string;
}

const YYYY_MM_DD_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate and normalize a date string from LLM output.
 * - Accepts YYYY-MM-DD directly
 * - Attempts to parse other formats (e.g., "March 15, 2026")
 * - Rejects dates > 1 year in the future or > 1 month in the past
 */
export function validateAndNormalizeDate(
  dateStr: string | null | undefined,
  fieldName: string
): DateValidationResult {
  if (!dateStr?.trim()) {
    return { valid: false, normalized: null, error: `${fieldName} is empty` };
  }

  const trimmed = dateStr.trim();
  let date: Date;

  if (YYYY_MM_DD_RE.test(trimmed)) {
    // Already in correct format — parse to validate
    date = new Date(trimmed + "T00:00:00");
  } else {
    // Attempt to parse other date formats
    date = new Date(trimmed);
  }

  if (isNaN(date.getTime())) {
    return { valid: false, normalized: null, error: `${fieldName} is not a valid date: "${trimmed}"` };
  }

  // Format to YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const normalized = `${year}-${month}-${day}`;

  // Range check: reject > 1 year future or > 1 month past
  const now = new Date();
  const oneYearFuture = new Date(now);
  oneYearFuture.setFullYear(oneYearFuture.getFullYear() + 1);
  const oneMonthPast = new Date(now);
  oneMonthPast.setMonth(oneMonthPast.getMonth() - 1);

  if (date > oneYearFuture) {
    return { valid: false, normalized: null, error: `${fieldName} is too far in the future: ${normalized}` };
  }

  if (date < oneMonthPast) {
    return { valid: false, normalized: null, error: `${fieldName} is too far in the past: ${normalized}` };
  }

  return { valid: true, normalized };
}
