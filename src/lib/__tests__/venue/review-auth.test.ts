import { describe, it, expect } from "vitest";
import { dealsReviewToken, isDealsReviewAuthorised } from "@/lib/venue/review-auth";

describe("deals-review key", () => {
  const secret = "site-wide-cron-secret";
  const token = dealsReviewToken(secret)!;

  it("accepts only the derived key", () => {
    expect(isDealsReviewAuthorised(`Bearer ${token}`, secret)).toBe(true);
  });

  it("rejects the site-wide CRON_SECRET itself", () => {
    expect(isDealsReviewAuthorised(`Bearer ${secret}`, secret)).toBe(false);
  });

  it("rejects missing, malformed and wrong headers", () => {
    expect(isDealsReviewAuthorised(null, secret)).toBe(false);
    expect(isDealsReviewAuthorised(token, secret)).toBe(false);
    expect(isDealsReviewAuthorised("Bearer nope", secret)).toBe(false);
    expect(isDealsReviewAuthorised(`Bearer ${token}`, undefined)).toBe(false);
  });

  it("is one-way and specific to this route", () => {
    expect(token).not.toContain(secret);
    expect(token).toHaveLength(64);
    expect(dealsReviewToken("another-secret")).not.toBe(token);
  });
});
