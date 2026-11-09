/**
 * Ping IndexNow by hand, the same call the nightly run makes.
 *
 *   npx tsx scripts/indexnow-ping.ts                          the event pages (/events, timetables, hubs)
 *   npx tsx scripts/indexnow-ping.ts /deals /for-venues       just these paths
 *
 * Needs no env: the key is public (public/<key>.txt). 200 or 202 means accepted.
 * The nightly route (/api/cron/daily-maintenance) and the deals review send their own.
 */
import { eventListingPaths, indexNowUrls, pingIndexNow } from "@/lib/indexnow";

const paths = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const list = paths.length ? paths : eventListingPaths();

pingIndexNow(list, { label: "manual", force: true }).then((r) => {
  console.log(JSON.stringify({ ...r, urlList: indexNowUrls(list) }, null, 2));
  if (r.status !== 200 && r.status !== 202) process.exit(1);
});
