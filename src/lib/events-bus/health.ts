import { createAdminClient } from "@/lib/supabase/admin";

/** Hours without a bus ingest (heartbeat or events) before the desk counts as stale. */
const STALE_HOURS = 48;
/** Apify free plan is $5/month; below this the Instagram fetch is about to stop. */
const APIFY_LOW_USD = 1;

export interface EventsDeskHealth {
  lastIngestAt: string | null;
  stale: boolean;
  apifyUsdLeft: number | null;
  apifyLow: boolean;
  line: string;
}

/**
 * Is the events-desk routine alive? Its apply Action posts to
 * /api/cron/events-bus/ingest every run (an empty batch is a heartbeat), which
 * stamps `event_sources.last_success_at` on the `instagram` row. Read by the
 * daily-maintenance-fetch workflow, which files a CRM row when it's stale.
 */
export async function eventsDeskHealth(): Promise<EventsDeskHealth> {
  const { data } = await createAdminClient()
    .from("event_sources")
    .select("last_success_at")
    .in("slug", ["instagram", "web-pages"]);
  const lastIngestAt =
    (data ?? []).map((r) => r.last_success_at as string | null).filter(Boolean).sort().pop() ?? null;
  const stale = !lastIngestAt || Date.now() - new Date(lastIngestAt).getTime() > STALE_HOURS * 3600e3;

  let apifyUsdLeft: number | null = null;
  const token = process.env.APIFY_API_TOKEN;
  if (token) {
    try {
      const res = await fetch("https://api.apify.com/v2/users/me/limits", {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(5000),
      });
      const json = await res.json();
      const used = json?.data?.current?.monthlyUsageUsd;
      const cap = json?.data?.limits?.maxMonthlyUsageUsd;
      if (typeof used === "number" && typeof cap === "number") apifyUsdLeft = Math.round((cap - used) * 100) / 100;
    } catch {}
  }
  const apifyLow = apifyUsdLeft !== null && apifyUsdLeft < APIFY_LOW_USD;
  const line = stale
    ? `STALE: no events-desk ingest since ${lastIngestAt ?? "ever"}`
    : `Live: last events-desk ingest ${lastIngestAt}${apifyUsdLeft !== null ? `, Apify $${apifyUsdLeft} left this month` : ""}`;
  return { lastIngestAt, stale, apifyUsdLeft, apifyLow, line };
}
