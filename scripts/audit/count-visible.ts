/**
 * What the /events list actually shows a visitor, computed with the same
 * roll-forward + grouping the page uses. Run:
 *   npx tsx --env-file=.env.local scripts/audit/count-visible.ts
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { filterEventsInRange } from "@/lib/events/filter-range";
import { groupEventsByDate } from "@/lib/events/group-by-date";
import { nowInBali } from "@/lib/events/bali-time";
import type { Event } from "@/types";

async function main() {
  const supabase = createAdminClient();
  const today = nowInBali().dateStr;
  const { data, error } = await supabase
    .from("events")
    .select("id,title,start_date,end_date,is_recurring,recurrence_rule,start_time,end_time,venue_name,category,status,created_at,event_tier")
    .eq("status", "approved")
    .or(`start_date.gte.${today},is_recurring.eq.true,end_date.gte.${today}`);
  if (error) throw error;
  const events = (data ?? []) as Event[];
  const rolled = filterEventsInRange(events, null, null);
  const groups = groupEventsByDate(rolled);
  const phantom = rolled.filter((e) => e.is_recurring && e.end_date && e.start_date < today && e.end_date >= today);
  console.log(`bali today: ${today}`);
  console.log(`approved rows fetched: ${events.length}; rolled visible: ${rolled.length}`);
  console.log(`recurring rows pinned to today as a multi-day span: ${phantom.length}`);
  let week = 0;
  for (const g of groups.slice(0, 8)) {
    const days = Math.round((Date.parse(g.dateKey) - Date.parse(today)) / 86400000);
    if (days <= 7) week += g.events.length;
    console.log(`${g.label.padEnd(20)} ${g.events.length}`);
  }
  console.log(`next 7 days total: ${week}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
