#!/usr/bin/env node
// scripts/backfill-megatix-times.mjs
//
// One-off + re-runnable backfill: Megatix events land with start_time=null
// because Megatix's start_datetime is date-only — the real time lives in the
// description ("Every Thursday | 6 PM"). The harvester now parses it for new
// events (megatix-harvest.mjs timeFromText); this fills the existing rows.
//
//   node scripts/backfill-megatix-times.mjs            # apply
//   node scripts/backfill-megatix-times.mjs --dry      # preview only

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Duplicated from scripts/scrape/megatix-harvest.mjs (importing it would run that
// file's harvest IIFE). Keep in sync if the parser changes.
function timeFromText(text) {
  if (!text) return null;
  const to24 = (hStr, minStr, ap) => {
    let h = parseInt(hStr, 10);
    if (!ap || h < 1 || h > 12) return null;
    const min = minStr || "00";
    ap = ap.toLowerCase();
    if (ap === "pm" && h !== 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${min}`;
  };
  const range = text.match(/\b(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?\s*[–—\-]\s*\d{1,2}(?:[:.]\d{2})?\s*(am|pm)\b/i);
  if (range) return to24(range[1], range[2], range[3] || range[4]);
  const single = text.match(/\b(\d{1,2})(?:[:.](\d{2}))?\s?(am|pm)\b/i);
  if (single) return to24(single[1], single[2], single[3]);
  return null;
}

const dry = process.argv.includes("--dry");

const { data: src } = await supabase.from("event_sources").select("id").eq("slug", "megatix").single();
if (!src) { console.error("no megatix source"); process.exit(1); }

const { data: rows, error } = await supabase
  .from("events")
  .select("id, title, description, start_time")
  .eq("source_id", src.id)
  .is("start_time", null)
  .in("status", ["pending", "approved"]);
if (error) { console.error(error.message); process.exit(1); }

let filled = 0, missed = 0;
for (const r of rows ?? []) {
  const t = timeFromText(r.description);
  if (!t) { missed++; console.log(`  MISS  ${r.title.slice(0, 50)}`); continue; }
  console.log(`  ${t}  ${r.title.slice(0, 50)}`);
  if (!dry) {
    const { error: uErr } = await supabase.from("events").update({ start_time: t, updated_at: new Date().toISOString() }).eq("id", r.id);
    if (uErr) { console.error(`  ERR ${r.id}: ${uErr.message}`); continue; }
  }
  filled++;
}
console.log(`\n${dry ? "[dry] would fill" : "filled"} ${filled}, no-time-in-description ${missed}, of ${rows?.length ?? 0} timeless megatix events`);
