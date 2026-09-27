/**
 * The done-walk's numbers, computed with the site's own code against production:
 * live listings, share with a way in, duplicates on the agenda (same day, same
 * gathering twice), unmoderated publishes, and share not from todo.today.
 *
 *   npx tsx --env-file=.env.local scripts/audit/walk-metrics.ts [--at=2026-09-27T17:00+08:00] [--list]
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { expandRecurrence } from "@/lib/recurrence";
import { bucketEventsByTime } from "@/lib/events/buckets";
import { nowInBali } from "@/lib/events/bali-time";
import type { Event } from "@/types";

const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const at = arg("at") ? new Date(arg("at")!) : new Date();
const list = process.argv.includes("--list");

function words(s: string | null) {
  return new Set(
    (s ?? "")
      .toLowerCase()
      .replace(/\bw\/.*$/, "")
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !["the", "and", "with", "ubud", "bali"].includes(w)),
  );
}
function jaccard(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return 0;
  let n = 0;
  for (const w of a) if (b.has(w)) n++;
  return n / (a.size + b.size - n);
}
const venueKey = (v: string | null) => (v ?? "").toLowerCase().replace(/[^a-z]/g, "").slice(0, 8);

async function main() {
  const supabase = createAdminClient();
  const today = nowInBali(at).dateStr;
  const { data, error } = await supabase
    .from("events")
    .select("id,slug,title,start_date,end_date,start_time,end_time,is_recurring,recurrence_rule,venue_name,venue_map_url,external_ticket_url,organizer_contact,organizer_instagram,organizer_name,price_info,moderation_reason,auto_approved_at,source_kind,event_tier,created_at,source:event_sources(slug)")
    .eq("status", "approved")
    .or(`start_date.gte.${today},is_recurring.eq.true,end_date.gte.${today}`);
  if (error) throw error;
  const rows = (data ?? []) as unknown as (Event & { auto_approved_at: string | null; source: { slug: string } | null })[];

  // Occurrences over the next 14 days, one per day per row (how the week view and the list read them).
  const occ: { e: (typeof rows)[number]; date: string }[] = [];
  const start = new Date(`${today}T00:00:00`);
  const end = new Date(start.getTime() + 14 * 86400000);
  for (const e of rows) {
    if (e.is_recurring && e.recurrence_rule) {
      for (const d of expandRecurrence(e, start, end)) {
        const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        occ.push({ e, date: ds });
      }
    } else if (e.start_date <= end.toISOString().slice(0, 10) && (e.end_date ?? e.start_date) >= today) {
      occ.push({ e, date: e.start_date < today ? today : e.start_date });
    }
  }
  const live = rows.filter((e) => occ.some((o) => o.e.id === e.id) || e.start_date > end.toISOString().slice(0, 10));
  const src = (e: (typeof rows)[number]) => e.source?.slug ?? e.source_kind ?? "none";
  const wayIn = (e: Event) => !!(e.external_ticket_url || e.organizer_contact || e.organizer_instagram);
  const AREA = /^(ubud|central ubud|outside ubud|bali|penestanan|sayan|kedewatan|mas|nyuh kuning|tbc|tba|secret.*|private.*|location.*|various)$/i;
  const walkIn = (e: Event) => !!e.venue_name && !AREA.test(e.venue_name.trim()) && !!e.venue_map_url;

  // Duplicates: same day, similar title (>=0.5) or same venue + same start time + overlapping title.
  const byDay = new Map<string, typeof occ>();
  for (const o of occ) byDay.set(o.date, [...(byDay.get(o.date) ?? []), o]);
  const dups: string[] = [];
  for (const [day, list] of byDay) {
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i].e, b = list[j].e;
        if (a.id === b.id) continue;
        const sim = jaccard(words(a.title), words(b.title));
        const sameSlot = venueKey(a.venue_name) === venueKey(b.venue_name) && a.start_time === b.start_time;
        if (sim >= 0.5 || (sameSlot && sim >= 0.25)) dups.push(`${day} ${sim.toFixed(2)} [${src(a)}] ${a.title} @${a.venue_name} ${a.start_time} <> [${src(b)}] ${b.title} @${b.venue_name} ${b.start_time}  (${a.id.slice(0, 8)} / ${b.id.slice(0, 8)})`);
      }
  }

  const bySrc: Record<string, number> = {};
  for (const e of live) bySrc[src(e)] = (bySrc[src(e)] ?? 0) + 1;
  const unmod = live.filter((e) => e.moderation_reason === "auto_gate:unmoderated");
  const since = new Date(at.getTime() - 30 * 86400000).toISOString();
  const recent = rows.filter((e) => e.auto_approved_at && e.auto_approved_at >= since);

  console.log(`at ${at.toISOString()} (bali ${today})`);
  console.log(`live listings (next 14d + later one-offs): ${live.length}`);
  console.log(`  with a ticket or organiser contact: ${live.filter(wayIn).length} (${Math.round((100 * live.filter(wayIn).length) / live.length)}%)`);
  console.log(`  with ticket/organiser OR a walk-in venue (real venue + map pin): ${live.filter((e) => wayIn(e) || walkIn(e)).length} (${Math.round((100 * live.filter((e) => wayIn(e) || walkIn(e)).length) / live.length)}%)`);
  console.log(`  area-only venue ("Ubud", "Outside Ubud"…): ${live.filter((e) => !e.venue_name || AREA.test(e.venue_name.trim())).length}`);
  console.log(`  raw prices (IDR 5+ digits, no separators): ${live.filter((e) => /IDR\s*\d{5,}/.test(e.price_info ?? "")).length}`);
  console.log(`  live rows published unmoderated: ${unmod.length}`);
  console.log(`  auto-published last 30d: ${recent.length}, of which unmoderated: ${recent.filter((e) => e.moderation_reason === "auto_gate:unmoderated").length}`);
  console.log(`  by source: ${JSON.stringify(bySrc)}; not todo.today: ${Math.round((100 * (live.length - (bySrc["todo-today"] ?? 0))) / live.length)}%`);
  console.log(`same-day duplicate pairs in next 14 days: ${dups.length}`);
  if (list) dups.forEach((d) => console.log("  " + d));

  const b = bucketEventsByTime(rows as Event[], at);
  console.log(`homepage at this instant: happening_now=${b.happening_now.length} today=${b.today.length}`);
  if (list) [...b.happening_now, ...b.today].forEach((e) => console.log(`  ${e.start_time}-${e.end_time ?? "?"} ${e.title}`));
}
main().catch((e) => { console.error(e); process.exit(1); });
