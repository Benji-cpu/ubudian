/**
 * Deal page numbers, one line per venue with a live deal, most viewed first.
 *
 *   npx tsx --env-file=.env.local scripts/deal-counts.mts        last 30 days
 *   npx tsx --env-file=.env.local scripts/deal-counts.mts 7      last 7 days
 *
 * Read-only. Same numbers as "Page views / taps" on /admin/deals.
 */
import { emptyCounts, getAllDealPageCounts } from "@/lib/specials/deal-counts";
import { venueSlug } from "@/lib/specials/deal-page";
import { getLiveSpecials } from "@/lib/specials/queries";

const days = Number(process.argv[2] ?? 30);
if (!Number.isInteger(days) || days < 1) {
  console.error("usage: deal-counts.mts [days]   (a whole number of days, default 30)");
  process.exit(1);
}

const [live, counts] = await Promise.all([getLiveSpecials(), getAllDealPageCounts(days)]);
const venues = new Map<string, string>();
for (const d of live) {
  const slug = venueSlug(d.venue_name);
  if (slug && !venues.has(slug)) venues.set(slug, d.venue_name);
}
// A venue whose deal has lapsed still has its rows: list it too, after the live ones.
for (const slug of counts.keys()) if (!venues.has(slug)) venues.set(slug, `${slug} (no live deal)`);

const rows = [...venues]
  .map(([slug, venue]) => ({ slug, venue, c: counts.get(slug) ?? emptyCounts() }))
  .sort((a, b) => b.c.views - a.c.views || b.c.taps - a.c.taps || a.venue.localeCompare(b.venue));

const width = Math.max(5, ...rows.map((r) => r.venue.length));
console.log(`Deal pages, last ${days} days: ${rows.length} venues`);
for (const { venue, c } of rows) {
  const kinds = Object.entries(c.byKind)
    .filter(([k, n]) => k !== "view" && n > 0)
    .map(([k, n]) => `${k} ${n}`)
    .join(", ");
  console.log(`${venue.padEnd(width)}  ${String(c.views).padStart(5)} views  ${String(c.taps).padStart(4)} taps${kinds ? `  (${kinds})` : ""}`);
}
