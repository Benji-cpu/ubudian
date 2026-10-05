import { createAdminClient } from "@/lib/supabase/admin";
import { nowInBali } from "@/lib/events/bali-time";
import { addDaysToDateStr } from "@/lib/specials";

/**
 * The deals pipeline: every restaurant, café, warung, bar, spa and yoga studio
 * in Ubud (`deal_venues`, ~1,000 rows) and where each one stands. Status is
 * derived from the venue row and its specials on every read, never stored, so
 * it can't drift from the data underneath it.
 *
 * Order matters: a venue shows its furthest stage.
 */
export const STAGES = [
  "not_checked",
  "nothing_found",
  "special_found",
  "venue_confirmed",
  "live",
  "reconfirm_due",
  "closed",
] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  not_checked: "Not checked",
  nothing_found: "Checked, nothing found",
  special_found: "Special found",
  venue_confirmed: "Venue confirmed",
  live: "Live",
  reconfirm_due: "Reconfirm due",
  closed: "Closed",
};

/** A live deal within this many days of lapsing counts as "reconfirm due". */
export const RECONFIRM_WINDOW_DAYS = 7;
/** A venue checked with nothing found is looked at again after this long. */
export const RECHECK_NOTHING_DAYS = 60;

export type PipelineVenue = {
  id: string;
  name: string;
  area: string | null;
  category: string | null;
  researched_at: string | null;
  next_check_on: string | null;
  closed_at: string | null;
  owner_user_id: string | null;
};

export type PipelineSpecial = {
  venue_id: string | null;
  status: string;
  source: string;
  expires_on: string;
};

export function stageFor(venue: PipelineVenue, specials: PipelineSpecial[], todayStr: string): Stage {
  if (venue.closed_at) return "closed";
  const live = specials.filter((s) => s.status === "live");
  // A live deal that has lapsed, or lapses within the window, needs the venue's yes again.
  const soon = addDaysToDateStr(todayStr, RECONFIRM_WINDOW_DAYS);
  if (live.some((s) => s.expires_on <= soon)) return "reconfirm_due";
  if (live.length > 0) return "live";
  // The venue itself has told us: it claimed its page, sent a deal, or one waits for review.
  const fromVenue = specials.some((s) => s.status === "pending" || s.source === "form");
  if (venue.owner_user_id || fromVenue) return "venue_confirmed";
  if (specials.length > 0) return "special_found";
  if (venue.researched_at) return "nothing_found";
  return "not_checked";
}

export type PipelineRow = PipelineVenue & { stage: Stage; specials: number };

export type PipelineSummary = {
  total: number;
  byStage: Record<Stage, number>;
  checkedToday: number;
  checkedThisWeek: number;
  /** Venues with a check due today or earlier (never checked, or past next_check_on). */
  dueNow: number;
  rows: PipelineRow[];
};

async function fetchAll<T>(table: string, cols: string): Promise<T[]> {
  const supabase = createAdminClient();
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(cols).range(from, from + 999);
    if (error) throw error;
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

export function summarise(venues: PipelineVenue[], specials: PipelineSpecial[], now: Date = new Date()): PipelineSummary {
  const today = nowInBali(now).dateStr;
  const weekAgo = addDaysToDateStr(today, -6);
  const byVenue = new Map<string, PipelineSpecial[]>();
  for (const s of specials) {
    if (!s.venue_id) continue;
    byVenue.set(s.venue_id, [...(byVenue.get(s.venue_id) ?? []), s]);
  }
  const byStage = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<Stage, number>;
  let checkedToday = 0;
  let checkedThisWeek = 0;
  let dueNow = 0;
  const rows = venues.map((v) => {
    const own = byVenue.get(v.id) ?? [];
    const stage = stageFor(v, own, today);
    byStage[stage] += 1;
    const checkedOn = v.researched_at ? nowInBali(new Date(v.researched_at)).dateStr : null;
    if (checkedOn === today) checkedToday += 1;
    if (checkedOn && checkedOn >= weekAgo) checkedThisWeek += 1;
    if (stage !== "closed" && (!v.researched_at || (v.next_check_on && v.next_check_on <= today))) dueNow += 1;
    return { ...v, stage, specials: own.length };
  });
  return { total: venues.length, byStage, checkedToday, checkedThisWeek, dueNow, rows };
}

export async function loadPipeline(): Promise<PipelineSummary> {
  const [venues, specials] = await Promise.all([
    fetchAll<PipelineVenue>(
      "deal_venues",
      "id, name, area, category, researched_at, next_check_on, closed_at, owner_user_id"
    ),
    fetchAll<PipelineSpecial>("specials", "venue_id, status, source, expires_on"),
  ]);
  return summarise(venues, specials);
}
