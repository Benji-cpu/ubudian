/**
 * Renders the weekly email to an HTML file for review. READ-ONLY: it queries the
 * same events and deals the send does, and sends nothing and writes no ledger row.
 *
 *   npx tsx --env-file=.env.local scripts/preview-weekly-email.ts 2026-10-14 <out.html>
 *
 * The date is the Bali Wednesday the issue would go out on (default: today, Bali).
 */
import { writeFileSync } from "node:fs";
import { addDays } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { nowInBali } from "@/lib/events/bali-time";
import { filterEventsInRange } from "@/lib/events/filter-range";
import { visibleListings } from "@/lib/events/listing-checks";
import { buildWeeklyDigestEmailHtml } from "@/lib/email/weekly-digest-email";
import { issueNumberFor, pickWeeklyDeals, buildPreheader } from "@/lib/email/weekly-deals";
import { spreadAcrossWeek } from "@/lib/email/week-spread";
import { getLiveSpecials } from "@/lib/specials/queries";
import { getWeekPicks } from "@/lib/events/picks";
import { SITE_URL } from "@/lib/constants";
import type { Event } from "@/types";

async function main() {
  const dateStr = process.argv[2] ?? nowInBali().dateStr;
  const out = process.argv[3] ?? `weekly-preview-${dateStr}.html`;
  const [y, m, d] = dateStr.split("-").map(Number);
  const day = new Date(y, m - 1, d);
  const toStr = addDays(day, 6).toISOString().slice(0, 10);

  const db = createAdminClient();
  const { data, error } = await db
    .from("events")
    .select("*")
    .eq("status", "approved")
    .or(`start_date.gte.${dateStr},is_recurring.eq.true`);
  if (error) throw error;

  const weekEvents = filterEventsInRange(visibleListings((data ?? []) as Event[]), dateStr, toStr);
  const issue = issueNumberFor(dateStr);
  const deals = pickWeeklyDeals(await getLiveSpecials(), day.getDay(), undefined, issue);
  const picks = spreadAcrossWeek(weekEvents, 5, dateStr, issue);

  const deskPicks = (await getWeekPicks(db, new Date(`${dateStr}T01:00:00Z`))).slice(0, 5).map(({ event, why }) => ({ event, why }));

  const html = buildWeeklyDigestEmailHtml({
    archetype: null,
    events: picks,
    siteUrl: SITE_URL,
    unsubUrl: `${SITE_URL}/api/email/unsubscribe?preview=1`,
    weekLabel: `Week of ${day.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`,
    deals,
    picks: deskPicks,
  });
  writeFileSync(out, html);
  console.log(`${out}: ${deals.length} deals, ${deskPicks.length} desk picks, ${picks.length} events`);
  console.log(`preheader: ${buildPreheader(deals, picks.length)}`);
  for (const s of deals) console.log(`  deal: ${s.venue_name} — ${s.title}`);
  for (const e of picks) console.log(`  event: ${e.start_date} ${e.title}`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
