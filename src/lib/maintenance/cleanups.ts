/**
 * Autonomous cleanup helpers run by the daily-maintenance cron and remote
 * scheduled agent. Each helper is idempotent — calling it twice in a row
 * should be a no-op the second time.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { titleSimilarity } from "@/lib/maintenance/similarity";
import { nowInBali } from "@/lib/events/bali-time";

export type BrokenLink = {
  entity: "event" | "venue";
  id: string;
  url: string;
  status: number | string;
};

export type LinkHealthReport = {
  checked: number;
  broken: BrokenLink[];
};

const LINK_TIMEOUT_MS = 5000;
const LINK_CONCURRENCY = 10;
// Megatix renders the "already taken place" copy ~26KB into the document, well
// past a 4KB window — which silently defeated stale detection. Scan enough of
// the body to reach it (and the JSON-LD block near the top is cheap either way).
const LINK_BODY_SCAN_BYTES = 40000;

// Megatix, Tickettailor, and buytickets.at 403 every default-UA HEAD as bot
// protection. Use a real browser UA and fall back from HEAD→GET on 4xx so
// servers that don't accept HEAD (or treat it as suspicious) still get a
// chance to return their real status.
const LINK_HEALTH_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

// A Cloudflare interstitial ("Just a moment…", "Attention Required") returns a
// 403/503 to every UA we can send — including a real browser's — so the host is
// actually reachable and the listing is fine. Treat these as healthy rather than
// spamming the digest review queue every single day (tickettailor.com does this).
const CF_CHALLENGE = /just a moment|attention required|cf-mitigated|enable javascript and cookies|cf_chl_|challenge-platform/i;

// Ticketing platforms that recycle a per-edition slug serve a 200 page reading
// "This event has already taken place" once the date passes. The URL is "alive"
// but the CTA is dead — a distinct, actionable problem from a real 4xx/5xx.
const STALE_EVENT = /this event has (already )?(taken place|ended|passed|finished)|event has ended|sale has ended|tickets are no longer/i;

// Hosts that can return a healthy 200 while the underlying event is stale, so we
// must read the body even on a 2xx HEAD to catch the "already taken place" case.
const STALE_PRONE_HOST = /(?:\/\/|\.)megatix\./i;

// Stale-prone ticketing pages (megatix) embed a schema.org JSON-LD block near
// the top of the document carrying the real event date. That's a far more
// reliable stale signal than the "already taken place" copy buried deep in the
// body — a no-year slug like `/events/beauty-way-jun` 200s happily while the
// JSON-LD startDate reads 2024. Parse it and treat an event whose last day is
// already past as stale, even on a healthy 200.
const JSONLD_START_DATE = /"startdate"\s*:\s*"(\d{4}-\d{2}-\d{2})/i;
const JSONLD_END_DATE = /"enddate"\s*:\s*"(\d{4}-\d{2}-\d{2})/i;

/** Last calendar day (YYYY-MM-DD) the embedded JSON-LD claims, or null. */
function embeddedEventLastDay(body: string): string | null {
  return body.match(JSONLD_END_DATE)?.[1] ?? body.match(JSONLD_START_DATE)?.[1] ?? null;
}

type ProbeResult = { status: number | string; body: string };

async function probe(url: string, method: "HEAD" | "GET"): Promise<ProbeResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), LINK_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method,
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent": LINK_HEALTH_UA,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
    });
    // HEAD has no body; only read (a capped slice of) the body on GET so we can
    // tell a Cloudflare challenge / stale-event page apart from a real failure.
    let body = "";
    if (method === "GET") {
      try {
        body = (await res.text()).slice(0, LINK_BODY_SCAN_BYTES).toLowerCase();
      } catch {
        body = "";
      }
    }
    return { status: res.status, body };
  } catch (err) {
    return { status: err instanceof Error ? err.name : "fetch_error", body: "" };
  } finally {
    clearTimeout(timer);
  }
}

async function headOnce(url: string): Promise<ProbeResult> {
  const first = await probe(url, "HEAD");
  if (typeof first.status === "number" && first.status < 400) {
    // Healthy HEAD. But some hosts (megatix) serve 200 for a passed event, so
    // GET-verify the body for those before trusting the green status.
    if (STALE_PRONE_HOST.test(url)) return probe(url, "GET");
    return first;
  }
  // HEAD returned 4xx/5xx or a non-numeric status — retry with GET. Many
  // ticketing platforms (megatix, tickettailor) return 403 to HEAD by policy,
  // and GET gives us a body to classify (challenge vs genuinely broken).
  return probe(url, "GET");
}

/**
 * Decide whether a probe result represents a genuinely broken link. Cloudflare
 * challenges are reachable (not broken); stale ticketing pages are broken but
 * flagged with a `stale` label so the human/agent clears the CTA rather than
 * chasing a "down" host. Everything ≥400 or non-numeric stays broken.
 */
function classifyLink(
  result: ProbeResult,
  todayISO: string,
): { broken: boolean; status: number | string } {
  const { status, body } = result;
  if (typeof status === "number" && (status === 403 || status === 503) && CF_CHALLENGE.test(body)) {
    return { broken: false, status: "cf-challenge" };
  }
  if (typeof status === "number" && status < 400) {
    // Healthy HTTP status, but the listing itself may be a past edition. Two
    // signals: the embedded JSON-LD event date is already behind us, or the
    // page carries the "already taken place" copy. Either means a dead CTA.
    const lastDay = embeddedEventLastDay(body);
    if ((lastDay && lastDay < todayISO) || STALE_EVENT.test(body)) {
      return { broken: true, status: "stale" };
    }
  }
  if (typeof status === "number") return { broken: status >= 400, status };
  return { broken: true, status };
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) return;
      try {
        results[idx] = { status: "fulfilled", value: await worker(items[idx]) };
      } catch (reason) {
        results[idx] = { status: "rejected", reason };
      }
    }
  });
  await Promise.all(runners);
  return results;
}

/**
 * HEAD every external_ticket_url on approved/pending events and every
 * venue_map_url (deduped by url) sourced from events. Returns a report of
 * URLs that returned 4xx/5xx or failed to fetch within {@link LINK_TIMEOUT_MS}.
 *
 * Throws on missing DB connection — the route's `.catch()` converts that into
 * an entry in `errors[]` so the rest of the digest still ships.
 */
export async function checkExternalLinkHealth(): Promise<LinkHealthReport> {
  const supabase = createAdminClient();

  const eventsRes = await supabase
    .from("events")
    .select("id, external_ticket_url, venue_name, venue_map_url, status")
    .in("status", ["approved", "pending"])
    .or("external_ticket_url.not.is.null,venue_map_url.not.is.null");

  if (eventsRes.error) throw new Error(`checkExternalLinkHealth fetch: ${eventsRes.error.message}`);

  type Row = {
    id: string;
    external_ticket_url: string | null;
    venue_name: string | null;
    venue_map_url: string | null;
  };
  const rows = (eventsRes.data ?? []) as Row[];

  type Target = { entity: "event" | "venue"; id: string; url: string };
  const targets: Target[] = [];
  const seenVenue = new Set<string>();
  for (const row of rows) {
    if (row.external_ticket_url) {
      targets.push({ entity: "event", id: row.id, url: row.external_ticket_url });
    }
    if (row.venue_map_url && !seenVenue.has(row.venue_map_url)) {
      seenVenue.add(row.venue_map_url);
      targets.push({
        entity: "venue",
        id: row.venue_name ?? row.venue_map_url,
        url: row.venue_map_url,
      });
    }
  }

  const settled = await runWithConcurrency(targets, LINK_CONCURRENCY, (t) => headOnce(t.url));

  const todayISO = nowInBali().dateStr;
  const broken: BrokenLink[] = [];
  settled.forEach((res, i) => {
    const t = targets[i];
    if (res.status === "rejected") {
      broken.push({ entity: t.entity, id: t.id, url: t.url, status: "fetch_error" });
      return;
    }
    const { broken: isBroken, status } = classifyLink(res.value, todayISO);
    if (isBroken) broken.push({ entity: t.entity, id: t.id, url: t.url, status });
  });

  return { checked: targets.length, broken };
}

/**
 * Hard-delete raw_ingestion_messages with status='failed' that are older than
 * 30 days. The pipeline retries failed messages for 24h then leaves them.
 * After a month they're noise — remove to keep the table lean.
 */
export async function purgeFailedMessages(olderThanDays = 30): Promise<number> {
  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("raw_ingestion_messages")
    .delete()
    .eq("status", "failed")
    .lt("created_at", cutoff)
    .select("id");

  if (error) {
    console.error("[purgeFailedMessages] error:", error);
    return 0;
  }
  return data?.length ?? 0;
}

/**
 * Cancel bookings stuck in 'pending' with no Stripe checkout session after
 * the abandon window (default 24h). These are users who started checkout but
 * bailed before being redirected to Stripe.
 */
export async function cancelStaleBookings(abandonHours = 24): Promise<number> {
  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - abandonHours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("status", "pending")
    .is("stripe_checkout_session_id", null)
    .lt("created_at", cutoff)
    .select("id");

  if (error) {
    console.error("[cancelStaleBookings] error:", error);
    return 0;
  }
  return data?.length ?? 0;
}

interface DupCandidate {
  id: string;
  title: string;
  venue_name: string | null;
  start_date: string;
  created_at: string;
}

/**
 * Find approved future events that look like duplicates (same start_date,
 * same canonicalised venue_name, title similarity ≥ threshold) and archive
 * the newer of each pair, recording the decision in dedup_decisions for
 * audit. The migration that backs dedup_decisions must be applied first;
 * otherwise the insert fails and the event stays approved (safe fallback).
 *
 * Compares titles via {@link titleSimilarity} (Jaccard over token bigrams +
 * substring boost) so we don't need pg_trgm at runtime.
 */
export async function archiveFuzzyDuplicateEvents(
  similarityThreshold = 0.85,
): Promise<number> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, venue_name, start_date, created_at")
    .eq("status", "approved")
    .gte("start_date", today)
    .order("start_date", { ascending: true });

  if (error || !events?.length) {
    if (error) console.error("[archiveFuzzyDuplicateEvents] fetch error:", error);
    return 0;
  }

  // Bucket by (start_date, normalised venue) — only events that share both can
  // be considered duplicates. Skip rows missing venue.
  const buckets = new Map<string, DupCandidate[]>();
  for (const e of events as DupCandidate[]) {
    const venueKey = (e.venue_name || "").trim().toLowerCase();
    if (!venueKey) continue;
    const key = `${e.start_date}::${venueKey}`;
    const arr = buckets.get(key) ?? [];
    arr.push(e);
    buckets.set(key, arr);
  }

  const archivedIds = new Set<string>();
  for (const candidates of buckets.values()) {
    if (candidates.length < 2) continue;
    // Sort oldest first so we keep the original and archive the later post.
    candidates.sort((a, b) => a.created_at.localeCompare(b.created_at));

    for (let i = 0; i < candidates.length; i += 1) {
      if (archivedIds.has(candidates[i].id)) continue;
      for (let j = i + 1; j < candidates.length; j += 1) {
        if (archivedIds.has(candidates[j].id)) continue;
        const sim = titleSimilarity(candidates[i].title, candidates[j].title);
        if (sim < similarityThreshold) continue;

        const { error: updErr } = await supabase
          .from("events")
          .update({ status: "archived" })
          .eq("id", candidates[j].id)
          .eq("status", "approved");

        if (updErr) {
          console.error("[archiveFuzzyDuplicateEvents] update error:", updErr);
          continue;
        }

        const { error: logErr } = await supabase.from("dedup_decisions").insert({
          kept_event_id: candidates[i].id,
          archived_event_id: candidates[j].id,
          reason: "fuzzy-duplicate (same date, same venue, similar title)",
          similarity: Number(sim.toFixed(3)),
          decided_by: "daily-maintenance",
        });
        // If the audit log insert fails (migration not applied), revert the
        // archive so the event reappears on the next run rather than being
        // silently lost.
        if (logErr) {
          console.error("[archiveFuzzyDuplicateEvents] log error, reverting:", logErr);
          await supabase
            .from("events")
            .update({ status: "approved" })
            .eq("id", candidates[j].id);
          continue;
        }
        archivedIds.add(candidates[j].id);
      }
    }
  }
  return archivedIds.size;
}
