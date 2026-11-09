import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEAL_EVENT_KINDS, type DealEventKind } from "./deal-track";

/**
 * The deal page counter's server half: what POST /api/deals/track accepts,
 * who it ignores, and the numbers a venue gets for its own page.
 */

/** Crawlers, link unfurlers, scripts and headless browsers (our Playwright runs included). Read, never stored. */
export const DEAL_BOT_UA =
  /bot|crawl|spider|slurp|headless|preview|lighthouse|facebookexternalhit|whatsapp|telegram|slack|discord|curl|python|go-http|playwright|puppeteer/i;

/** A real browser always sends a user agent, so an empty one counts as a bot. */
export function isBotUserAgent(ua: string | null | undefined): boolean {
  const s = ua?.trim();
  return !s || DEAL_BOT_UA.test(s);
}

/** The body the page's tracker sends. The slug is `venueSlug()` output: lowercase letters, digits and hyphens. */
export const dealTrackSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{1,120}$/),
  kind: z.enum(DEAL_EVENT_KINDS),
  specialId: z.string().uuid().optional(),
});
export type DealTrack = z.infer<typeof dealTrackSchema>;

export type DealPageCounts = {
  /** Views: one per venue per browser session. */
  views: number;
  /** Taps on the map, website, Instagram, share and booking links. */
  taps: number;
  byKind: Record<DealEventKind, number>;
};

export function emptyCounts(): DealPageCounts {
  return { views: 0, taps: 0, byKind: Object.fromEntries(DEAL_EVENT_KINDS.map((k) => [k, 0])) as Record<DealEventKind, number> };
}

/** Add up event rows. A kind the table doesn't know is skipped rather than counted as a tap. */
export function summarizeCounts(rows: { kind: string }[]): DealPageCounts {
  const out = emptyCounts();
  for (const { kind } of rows) {
    if (!(DEAL_EVENT_KINDS as readonly string[]).includes(kind)) continue;
    out.byKind[kind as DealEventKind] += 1;
    if (kind === "view") out.views += 1;
    else out.taps += 1;
  }
  return out;
}

/** The ISO time `days` days before `now`. */
export function sinceIso(days: number, now: Date = new Date()): string {
  return new Date(now.getTime() - Math.max(0, days) * 86_400_000).toISOString();
}

const PAGE = 1000;

/** Every row since `since`, a page at a time (PostgREST caps a read at 1,000 rows). */
async function readRows(since: string, slug?: string): Promise<{ venue_slug: string; kind: string }[]> {
  const supabase = createAdminClient();
  const rows: { venue_slug: string; kind: string }[] = [];
  for (let from = 0; ; from += PAGE) {
    let q = supabase.from("deal_page_events").select("venue_slug, kind").gte("created_at", since).order("id").range(from, from + PAGE - 1);
    if (slug) q = q.eq("venue_slug", slug);
    const { data, error } = await q;
    if (error) throw new Error(`deal_page_events: ${error.message}`);
    rows.push(...((data ?? []) as { venue_slug: string; kind: string }[]));
    if (!data || data.length < PAGE) return rows;
  }
}

/** One venue's page over the last `days` days: `{ views, taps, byKind }`. */
export async function getDealPageCounts(slug: string, days = 30): Promise<DealPageCounts> {
  return summarizeCounts(await readRows(sinceIso(days), slug));
}

/** Every venue's page over the last `days` days, keyed by slug. Venues with no rows are absent. */
export async function getAllDealPageCounts(days = 30): Promise<Map<string, DealPageCounts>> {
  const bySlug = new Map<string, { kind: string }[]>();
  for (const r of await readRows(sinceIso(days))) {
    const list = bySlug.get(r.venue_slug);
    if (list) list.push(r);
    else bySlug.set(r.venue_slug, [r]);
  }
  return new Map([...bySlug].map(([slug, rows]) => [slug, summarizeCounts(rows)]));
}
