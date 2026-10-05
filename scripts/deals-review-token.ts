/**
 * Print the deals-review key derived from CRON_SECRET, for the bus repo's
 * DEALS_REVIEW_SECRET secret:
 *   npx tsx --env-file=.env.local scripts/deals-review-token.ts | gh secret set DEALS_REVIEW_SECRET -R Benji-cpu/ubudian-deals-bus
 * Never paste the output into chat or a file.
 */
import { dealsReviewToken } from "@/lib/venue/review-auth";

const t = dealsReviewToken(process.env.CRON_SECRET);
if (!t) {
  console.error("CRON_SECRET missing");
  process.exit(1);
}
process.stdout.write(t);
