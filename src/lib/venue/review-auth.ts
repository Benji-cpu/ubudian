import { createHmac, timingSafeEqual } from "crypto";

/**
 * The deals-review route has its own key, derived one-way from CRON_SECRET, so
 * the private bus repo (where the review routine can push) never holds the
 * site-wide secret that eight cron routes accept. A leak of this value can only
 * do what the review route does: publish, flag or reject deals the site issued.
 * The derivation cannot be reversed to CRON_SECRET, and no Vercel env var is
 * needed. Compute it with `scripts/deals-review-token.ts`.
 */
export function dealsReviewToken(cronSecret: string | undefined): string | null {
  if (!cronSecret) return null;
  return createHmac("sha256", cronSecret).update("ubudian:deals-review:v1").digest("hex");
}

/** True when the request carries `Authorization: Bearer <derived token>` and nothing else is accepted. */
export function isDealsReviewAuthorised(authHeader: string | null, cronSecret: string | undefined = process.env.CRON_SECRET): boolean {
  const expected = dealsReviewToken(cronSecret);
  if (!expected || !authHeader?.startsWith("Bearer ")) return false;
  const given = Buffer.from(authHeader.slice(7));
  const want = Buffer.from(expected);
  return given.length === want.length && timingSafeEqual(given, want);
}
