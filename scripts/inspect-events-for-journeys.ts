/**
 * One-off: inspect approved upcoming events grouped by theme buckets so we can
 * pick real events to seed as `event_ref` atoms on the launch journeys.
 *
 * Usage: npx tsx scripts/inspect-events-for-journeys.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

interface EventRow {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  venue_name: string | null;
  start_date: string;
  start_time: string | null;
  is_recurring: boolean;
}

const THEME_BUCKETS: Record<string, { keywords: RegExp; categories: string[] }> = {
  yoga: {
    keywords: /yoga|asana|hatha|vinyasa|yin|kundalini/i,
    categories: ["Yoga & Meditation"],
  },
  breath: {
    keywords: /breath|breathwork|pranayama|wim hof/i,
    categories: ["Yoga & Meditation", "Healing & Bodywork"],
  },
  cacao: {
    keywords: /cacao|chocolate ceremony/i,
    categories: ["Ceremony & Sound", "Circle & Community"],
  },
  sound: {
    keywords: /sound|gong|sing(ing)? bowl|kirtan|nada/i,
    categories: ["Ceremony & Sound", "Music & Performance"],
  },
  dance: {
    keywords: /ecstatic|dance|movement|conscious dance/i,
    categories: ["Dance & Movement"],
  },
  ceremony: {
    keywords: /ceremony|ritual|temple|puja|fire/i,
    categories: ["Ceremony & Sound"],
  },
  integration: {
    keywords: /integration|sharing|circle|tea|men[' ]?s|women[' ]?s/i,
    categories: ["Circle & Community"],
  },
  bodywork: {
    keywords: /massage|bodywork|somatic|tantric/i,
    categories: ["Healing & Bodywork", "Tantra & Intimacy"],
  },
};

async function main() {
  const today = new Date().toISOString().split("T")[0];
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 30);
  const horizonStr = horizon.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("events")
    .select("id, title, slug, category, venue_name, start_date, start_time, is_recurring")
    .eq("status", "approved")
    .gte("start_date", today)
    .lte("start_date", horizonStr)
    .order("start_date", { ascending: true });

  if (error) {
    console.error("query error:", error);
    process.exit(1);
  }
  const rows = (data ?? []) as EventRow[];
  console.log(`Loaded ${rows.length} approved events between ${today} and ${horizonStr}\n`);

  for (const [bucket, { keywords, categories }] of Object.entries(THEME_BUCKETS)) {
    const matched = rows.filter(
      (r) =>
        (r.category && categories.includes(r.category)) ||
        (r.title && keywords.test(r.title)),
    );
    console.log(`=== ${bucket.toUpperCase()} (${matched.length}) ===`);
    for (const r of matched.slice(0, 8)) {
      const cat = r.category ?? "—";
      const venue = r.venue_name ?? "?";
      const time = r.start_time ?? "—";
      const rec = r.is_recurring ? " [recurring]" : "";
      console.log(`  ${r.id}  ${r.start_date} ${time}  ${r.title}  @ ${venue}  [${cat}]${rec}`);
    }
    console.log();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
